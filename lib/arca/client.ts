import type { ArcaToken, ArcaSettings } from '@/types/arca'

const WSFEV1_HOMO = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
const WSFEV1_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'

interface SOAPOpts {
  cuit: string
  token: ArcaToken
  env: ArcaSettings['environment']
}

/**
 * Parses an ARCA <Errors> block. ARCA returns errors inside the SOAP response
 * (HTTP 200) when validation fails — `Resultado=R` plus an Errors element.
 */
function parseArcaErrors(xml: string): string | null {
  const errorsMatch = xml.match(/<Errors>([\s\S]*?)<\/Errors>/)
  if (!errorsMatch) return null
  const messages = [...errorsMatch[1].matchAll(/<Msg>([\s\S]*?)<\/Msg>/g)]
    .map(m => m[1].trim())
    .filter(Boolean)
  return messages.length ? messages.join(' | ') : null
}

function parseSoapFault(xml: string): string | null {
  const m = xml.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/i)
  return m ? m[1].trim() : null
}

async function callWsfev1(action: string, innerBody: string, opts: SOAPOpts, attempt = 0): Promise<string> {
  const url = opts.env === 'production' ? WSFEV1_PROD : WSFEV1_HOMO

  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Body>
    ${innerBody}
  </soap:Body>
</soap:Envelope>`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: `http://ar.gov.afip.dif.FEV1/${action}`,
      },
      body: envelope,
      signal: AbortSignal.timeout(30000), // 30s timeout
    })
  } catch (err) {
    // Network/timeout — retry once
    if (attempt < 1) {
      await new Promise(r => setTimeout(r, 1000))
      return callWsfev1(action, innerBody, opts, attempt + 1)
    }
    throw new Error(`WSFEV1 sin conexión: ${err instanceof Error ? err.message : 'desconocido'}`)
  }

  const xml = await res.text()

  if (!res.ok) {
    const fault = parseSoapFault(xml)
    if (res.status >= 500 && attempt < 1) {
      await new Promise(r => setTimeout(r, 1000))
      return callWsfev1(action, innerBody, opts, attempt + 1)
    }
    throw new Error(`WSFEV1 HTTP ${res.status}: ${fault ?? xml.slice(0, 200)}`)
  }

  const fault = parseSoapFault(xml)
  if (fault) throw new Error(`WSFEV1 SOAP fault: ${fault}`)

  return xml
}

function authXml(opts: SOAPOpts): string {
  return `<ar:Auth>
      <ar:Token>${opts.token.token}</ar:Token>
      <ar:Sign>${opts.token.sign}</ar:Sign>
      <ar:Cuit>${opts.cuit}</ar:Cuit>
    </ar:Auth>`
}

export async function feCompUltimoAutorizado(
  opts: SOAPOpts,
  ptoVta: number,
  cbteTipo: number
): Promise<number> {
  const body = `<ar:FECompUltimoAutorizado>
    ${authXml(opts)}
    <ar:PtoVta>${ptoVta}</ar:PtoVta>
    <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>
  </ar:FECompUltimoAutorizado>`

  const xml = await callWsfev1('FECompUltimoAutorizado', body, opts)

  const errs = parseArcaErrors(xml)
  if (errs) throw new Error(`ARCA: ${errs}`)

  const match = xml.match(/<CbteNro>(\d+)<\/CbteNro>/)
  return match ? parseInt(match[1]) : 0
}

export interface FECAEDetRequest {
  CantReg: number
  PtoVta: number
  CbteTipo: number
  Concepto: number
  DocTipo: number
  DocNro: string
  CbteDesde: number
  CbteHasta: number
  CbteFch: string // YYYYMMDD
  ImpTotal: number
  ImpTotConc: number
  ImpNeto: number
  ImpOpEx: number
  ImpTrib: number
  ImpIVA: number
  MonId: string
  MonCotiz: number
  Iva: Array<{ Id: number; BaseImp: number; Importe: number }>
}

export interface FECAEDetResponse {
  CbteNro: number
  CAE: string
  CAEFchVto: string
  Resultado: 'A' | 'R' | 'P'
  Observaciones?: string
  Errors?: string
}

export async function fecaeSolicitar(
  opts: SOAPOpts,
  req: FECAEDetRequest
): Promise<FECAEDetResponse> {
  // For Factura C, ARCA does not accept the Iva block — only ImpNeto = ImpTotal.
  // CbteTipo: 1=A, 6=B, 11=C, 51=M, 201/206/211=MiPyME equivalents.
  const isFacturaC = req.CbteTipo === 11 || req.CbteTipo === 12 || req.CbteTipo === 13

  const ivaXml = isFacturaC
    ? ''
    : req.Iva.length > 0
      ? `<ar:Iva>${req.Iva.map(
          iva =>
            `<ar:AlicIva>
            <ar:Id>${iva.Id}</ar:Id>
            <ar:BaseImp>${iva.BaseImp.toFixed(2)}</ar:BaseImp>
            <ar:Importe>${iva.Importe.toFixed(2)}</ar:Importe>
          </ar:AlicIva>`
        ).join('\n          ')}</ar:Iva>`
      : ''

  const body = `<ar:FECAESolicitar>
    ${authXml(opts)}
    <ar:FeCAEReq>
      <ar:FeCabReq>
        <ar:CantReg>${req.CantReg}</ar:CantReg>
        <ar:PtoVta>${req.PtoVta}</ar:PtoVta>
        <ar:CbteTipo>${req.CbteTipo}</ar:CbteTipo>
      </ar:FeCabReq>
      <ar:FeDetReq>
        <ar:FECAEDetRequest>
          <ar:Concepto>${req.Concepto}</ar:Concepto>
          <ar:DocTipo>${req.DocTipo}</ar:DocTipo>
          <ar:DocNro>${req.DocNro}</ar:DocNro>
          <ar:CbteDesde>${req.CbteDesde}</ar:CbteDesde>
          <ar:CbteHasta>${req.CbteHasta}</ar:CbteHasta>
          <ar:CbteFch>${req.CbteFch}</ar:CbteFch>
          <ar:ImpTotal>${req.ImpTotal.toFixed(2)}</ar:ImpTotal>
          <ar:ImpTotConc>${req.ImpTotConc.toFixed(2)}</ar:ImpTotConc>
          <ar:ImpNeto>${req.ImpNeto.toFixed(2)}</ar:ImpNeto>
          <ar:ImpOpEx>${req.ImpOpEx.toFixed(2)}</ar:ImpOpEx>
          <ar:ImpTrib>${req.ImpTrib.toFixed(2)}</ar:ImpTrib>
          <ar:ImpIVA>${req.ImpIVA.toFixed(2)}</ar:ImpIVA>
          <ar:MonId>${req.MonId}</ar:MonId>
          <ar:MonCotiz>${req.MonCotiz}</ar:MonCotiz>
          ${ivaXml}
        </ar:FECAEDetRequest>
      </ar:FeDetReq>
    </ar:FeCAEReq>
  </ar:FECAESolicitar>`

  const xml = await callWsfev1('FECAESolicitar', body, opts)

  // Header-level errors first
  const headerErrs = parseArcaErrors(xml.split('<FeDetResp>')[0] ?? xml)
  if (headerErrs) throw new Error(`ARCA: ${headerErrs}`)

  const resultado = xml.match(/<Resultado>(A|R|P)<\/Resultado>/)?.[1] as 'A' | 'R' | 'P' | undefined
  if (!resultado) throw new Error(`WSFEV1 respuesta inválida: ${xml.slice(0, 500)}`)

  // Detail-level observations / errors
  const obsBlock = xml.match(/<Observaciones>([\s\S]*?)<\/Observaciones>/)?.[1]
  const observaciones = obsBlock
    ? [...obsBlock.matchAll(/<Msg>([\s\S]*?)<\/Msg>/g)].map(m => m[1].trim()).join(' | ')
    : undefined

  const detailErrors = parseArcaErrors(xml)

  return {
    CbteNro: parseInt(xml.match(/<CbteNro>(\d+)<\/CbteNro>/)?.[1] ?? '0'),
    CAE: xml.match(/<CAE>(\w+)<\/CAE>/)?.[1] ?? '',
    CAEFchVto: xml.match(/<CAEFchVto>(\d+)<\/CAEFchVto>/)?.[1] ?? '',
    Resultado: resultado,
    Observaciones: observaciones,
    Errors: detailErrors ?? undefined,
  }
}

/**
 * Server status check — useful for diagnostics. Returns AppServer/DbServer/AuthServer.
 */
export async function feDummy(opts: SOAPOpts): Promise<{ AppServer: string; DbServer: string; AuthServer: string }> {
  const body = `<ar:FEDummy/>`
  const xml = await callWsfev1('FEDummy', body, opts)
  return {
    AppServer: xml.match(/<AppServer>(\w+)<\/AppServer>/)?.[1] ?? 'unknown',
    DbServer: xml.match(/<DbServer>(\w+)<\/DbServer>/)?.[1] ?? 'unknown',
    AuthServer: xml.match(/<AuthServer>(\w+)<\/AuthServer>/)?.[1] ?? 'unknown',
  }
}
