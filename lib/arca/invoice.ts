import { getArcaToken } from './auth'
import { feCompUltimoAutorizado, fecaeSolicitar } from './client'
import type { ArcaSettings, InvoiceRequest, FECAEResult } from '@/types/arca'
import type { FECAEDetRequest } from './client'

// AFIP comp tipo codes
const COMP_TIPO: Record<string, number> = { A: 1, B: 6, C: 11 }

// IVA alícuota codes used by AFIP
const IVA_CODE: Record<number, number> = {
  0: 3,
  2.5: 9,
  5: 8,
  10.5: 4,
  21: 5,
  27: 6,
}

function todayYYYYMMDD(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

export async function emitInvoice(
  settings: ArcaSettings,
  req: InvoiceRequest
): Promise<{ result: FECAEResult; updatedSettings: ArcaSettings }> {
  if (req.invoice_type === 'ticket' || req.invoice_type === 'non_fiscal') {
    throw new Error('Los tickets no fiscales no se emiten por ARCA')
  }

  const cbteTipo = COMP_TIPO[req.invoice_type]
  if (!cbteTipo) throw new Error(`Tipo de comprobante no soportado: ${req.invoice_type}`)

  const { token, updatedSettings } = await getArcaToken(settings)

  const opts = { cuit: settings.cuit, token, env: settings.environment }

  const lastNro = await feCompUltimoAutorizado(opts, settings.punto_venta, cbteTipo)
  const nextNro = lastNro + 1

  // Build IVA breakdown from line items
  const ivaMap = new Map<number, { BaseImp: number; Importe: number }>()
  for (const item of req.items) {
    const rate = item.tax_rate ?? 21
    const code = IVA_CODE[rate] ?? 5
    const base = Math.round((item.subtotal / (1 + rate / 100)) * 100) / 100
    const imp = Math.round((item.subtotal - base) * 100) / 100
    const prev = ivaMap.get(code) ?? { BaseImp: 0, Importe: 0 }
    ivaMap.set(code, { BaseImp: prev.BaseImp + base, Importe: prev.Importe + imp })
  }

  const ivaArray = Array.from(ivaMap.entries()).map(([Id, v]) => ({
    Id,
    BaseImp: Math.round(v.BaseImp * 100) / 100,
    Importe: Math.round(v.Importe * 100) / 100,
  }))

  const impNeto = ivaArray.reduce((s, v) => s + v.BaseImp, 0)
  const impIva = ivaArray.reduce((s, v) => s + v.Importe, 0)

  // Resolve document type/number
  let docTipo = 99 // consumidor final
  let docNro = '0'
  if (req.customer_cuit) {
    const digits = req.customer_cuit.replace(/\D/g, '')
    if (digits.length === 11) {
      docTipo = 80 // CUIT
      docNro = digits
    } else if (digits.length === 8) {
      docTipo = 96 // DNI
      docNro = digits
    }
  }

  const fecaeReq: FECAEDetRequest = {
    CantReg: 1,
    PtoVta: settings.punto_venta,
    CbteTipo: cbteTipo,
    Concepto: 1, // 1=Productos, 2=Servicios, 3=Productos y Servicios
    DocTipo: docTipo,
    DocNro: docNro,
    CbteDesde: nextNro,
    CbteHasta: nextNro,
    CbteFch: todayYYYYMMDD(),
    ImpTotal: Math.round(req.total * 100) / 100,
    ImpTotConc: 0,
    ImpNeto: Math.round(impNeto * 100) / 100,
    ImpOpEx: 0,
    ImpTrib: 0,
    ImpIVA: Math.round(impIva * 100) / 100,
    MonId: 'PES',
    MonCotiz: 1,
    Iva: ivaArray,
  }

  const response = await fecaeSolicitar(opts, fecaeReq)

  if (response.Resultado !== 'A') {
    throw new Error(`ARCA rechazó la factura: ${response.Observaciones ?? 'sin detalle'}`)
  }

  const vto = response.CAEFchVto
  const caeVto = vto.length === 8
    ? `${vto.slice(0, 4)}-${vto.slice(4, 6)}-${vto.slice(6, 8)}`
    : vto

  return {
    result: { invoice_number: nextNro, cae: response.CAE, cae_vto: caeVto, comp_tipo: cbteTipo },
    updatedSettings,
  }
}

/**
 * Build the QR data string per ARCA standard (base64url JSON).
 */
export function buildArcaQRData(params: {
  cuit: string
  fecha: string
  ptoVta: number
  cbteTipo: number
  cbteNro: number
  importe: number
  moneda: string
  cae: string
}): string {
  const json = JSON.stringify({
    ver: 1,
    fecha: params.fecha,
    cuit: parseInt(params.cuit),
    ptoVta: params.ptoVta,
    tipoCmp: params.cbteTipo,
    nroCmp: params.cbteNro,
    importe: params.importe,
    moneda: params.moneda,
    ctz: 1,
    tipoDocRec: 99,
    nroDocRec: 0,
    tipoCodAut: 'E',
    codAut: parseInt(params.cae),
  })
  return Buffer.from(json).toString('base64url')
}
