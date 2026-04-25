import type { ArcaToken, ArcaSettings } from '@/types/arca'

const WSFEV1_HOMO = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
const WSFEV1_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'

interface SOAPOpts {
  cuit: string
  token: ArcaToken
  env: ArcaSettings['environment']
}

async function callWsfev1(action: string, innerBody: string, opts: SOAPOpts): Promise<string> {
  const url = opts.env === 'production' ? WSFEV1_PROD : WSFEV1_HOMO

  const envelope = `<?xml version="1.0" encoding="utf-8"?>\n<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">\n  <soap:Body>\n    ${innerBody}\n  </soap:Body>\n</soap:Envelope>`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: `http://ar.gov.afip.dif.FEV1/${action}`,
    },
    body: envelope,
  })

  if (!res.ok) throw new Error(`WSFEV1 HTTP ${res.status}`)
  return res.text()
}

function authXml(opts: SOAPOpts): string {
  return `<ar:Auth>\n      <ar:Token>${opts.token.token}</ar:Token>\n      <ar:Sign>${opts.token.sign}</ar:Sign>\n      <ar:Cuit>${opts.cuit}</ar:Cuit>\n    </ar:Auth>`
}

export async function feCompUltimoAutorizado(
  opts: SOAPOpts,
  ptoVta: number,
  cbteTipo: number
): Promise<number> {
  const body = `<ar:FECompUltimoAutorizado>\n    ${authXml(opts)}\n    <ar:PtoVta>${ptoVta}</ar:PtoVta>\n    <ar:CbteTipo>${cbteTipo}</ar:CbteTipo>\n  </ar:FECompUltimoAutorizado>`

  const xml = await callWsfev1('FECompUltimoAutorizado', body, opts)
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
  Resultado: 'A' | 'R'
  Observaciones?: string
}

export async function fecaeSolicitar(
  opts: SOAPOpts,
  req: FECAEDetRequest
): Promise<FECAEDetResponse> {
  const ivaXml = req.Iva.map(
    iva =>
      `<ar:AlicIva>\n            <ar:Id>${iva.Id}</ar:Id>\n            <ar:BaseImp>${iva.BaseImp.toFixed(2)}</ar:BaseImp>\n            <ar:Importe>${iva.Importe.toFixed(2)}</ar:Importe>\n          </ar:AlicIva>`
  ).join('\n          ')

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
          <ar:Iva>${ivaXml}</ar:Iva>
        </ar:FECAEDetRequest>
      </ar:FeDetReq>
    </ar:FeCAEReq>
  </ar:FECAESolicitar>`

  const xml = await callWsfev1('FECAESolicitar', body, opts)

  const resultado = xml.match(/<Resultado>(A|R)<\/Resultado>/)?.[1] as 'A' | 'R' | undefined
  if (!resultado) throw new Error(`WSFEV1 respuesta inválida: ${xml.slice(0, 500)}`)

  return {
    CbteNro: parseInt(xml.match(/<CbteNro>(\d+)<\/CbteNro>/)?.[1] ?? '0'),
    CAE: xml.match(/<CAE>(\w+)<\/CAE>/)?.[1] ?? '',
    CAEFchVto: xml.match(/<CAEFchVto>(\d+)<\/CAEFchVto>/)?.[1] ?? '',
    Resultado: resultado,
    Observaciones: xml.match(/<Msg>([\s\S]*?)<\/Msg>/)?.[1],
  }
}
