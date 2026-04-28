import { getArcaToken } from './auth'
import { feCompUltimoAutorizado, fecaeSolicitar } from './client'
import type { ArcaSettings, InvoiceRequest, FECAEResult } from '@/types/arca'
import type { FECAEDetRequest } from './client'

// AFIP comprobante codes
// 1=Factura A, 6=Factura B, 11=Factura C
// 2=NC A, 3=ND A, 7=NC B, 8=ND B, 12=NC C, 13=ND C
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
  // AR-local date (UTC-3) for CbteFch
  const now = new Date()
  const arOffset = -3 * 60
  const local = new Date(now.getTime() + (arOffset - now.getTimezoneOffset()) * 60000)
  return local.toISOString().slice(0, 10).replace(/-/g, '')
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * For invoices A/B (priced with IVA included), reverse-calculate the IVA breakdown.
 * For invoice C, treat the full amount as ImpNeto (no IVA breakdown).
 */
function calculateAmounts(req: InvoiceRequest, invoiceType: 'A' | 'B' | 'C') {
  if (invoiceType === 'C') {
    // Factura C: monotributistas, no discriminan IVA. ImpNeto = total.
    return {
      impNeto: round2(req.total),
      impIva: 0,
      ivaArray: [] as Array<{ Id: number; BaseImp: number; Importe: number }>,
    }
  }

  // A/B: prices include IVA, reverse-calc base
  const ivaMap = new Map<number, { BaseImp: number; Importe: number }>()
  for (const item of req.items) {
    const rate = item.tax_rate ?? 21
    const code = IVA_CODE[rate] ?? 5
    const lineGross = item.subtotal // already includes any line discount
    const base = round2(lineGross / (1 + rate / 100))
    const imp = round2(lineGross - base)
    const prev = ivaMap.get(code) ?? { BaseImp: 0, Importe: 0 }
    ivaMap.set(code, {
      BaseImp: round2(prev.BaseImp + base),
      Importe: round2(prev.Importe + imp),
    })
  }

  const ivaArray = Array.from(ivaMap.entries()).map(([Id, v]) => ({ Id, ...v }))
  const impNeto = round2(ivaArray.reduce((s, v) => s + v.BaseImp, 0))
  const impIva = round2(ivaArray.reduce((s, v) => s + v.Importe, 0))

  return { impNeto, impIva, ivaArray }
}

function resolveDoc(invoiceType: 'A' | 'B' | 'C', customerCuit?: string): { docTipo: number; docNro: string } {
  // Factura A REQUIRES CUIT receptor
  if (invoiceType === 'A') {
    const digits = (customerCuit ?? '').replace(/\D/g, '')
    if (digits.length !== 11) {
      throw new Error('Factura A requiere CUIT del receptor (11 dígitos)')
    }
    return { docTipo: 80, docNro: digits }
  }

  // B/C: optional. Identify if provided.
  if (customerCuit) {
    const digits = customerCuit.replace(/\D/g, '')
    if (digits.length === 11) return { docTipo: 80, docNro: digits } // CUIT
    if (digits.length === 8 || digits.length === 7) return { docTipo: 96, docNro: digits } // DNI
  }
  return { docTipo: 99, docNro: '0' } // Consumidor Final
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

  if (!req.items || req.items.length === 0) {
    throw new Error('La factura debe tener al menos un item')
  }
  if (req.total <= 0) throw new Error('El total debe ser mayor a cero')

  const { token, updatedSettings } = await getArcaToken(settings)
  const opts = { cuit: settings.cuit, token, env: settings.environment }

  const { impNeto, impIva, ivaArray } = calculateAmounts(req, req.invoice_type)
  const { docTipo, docNro } = resolveDoc(req.invoice_type, req.customer_cuit)

  // Get next invoice number. Note: this is NOT atomic with FECAESolicitar — if two
  // requests come at the same time we'd both get N+1. ARCA rejects the second with
  // "El comprobante ya fue informado". The retry loop handles this.
  let lastNro = await feCompUltimoAutorizado(opts, settings.punto_venta, cbteTipo)
  let attempt = 0
  const maxAttempts = 3

  while (attempt < maxAttempts) {
    const nextNro = lastNro + 1

    const fecaeReq: FECAEDetRequest = {
      CantReg: 1,
      PtoVta: settings.punto_venta,
      CbteTipo: cbteTipo,
      Concepto: 1, // 1=Productos
      DocTipo: docTipo,
      DocNro: docNro,
      CbteDesde: nextNro,
      CbteHasta: nextNro,
      CbteFch: todayYYYYMMDD(),
      ImpTotal: round2(req.total),
      ImpTotConc: 0,
      ImpNeto: impNeto,
      ImpOpEx: 0,
      ImpTrib: 0,
      ImpIVA: impIva,
      MonId: 'PES',
      MonCotiz: 1,
      Iva: ivaArray,
    }

    const response = await fecaeSolicitar(opts, fecaeReq)

    if (response.Resultado === 'A') {
      const vto = response.CAEFchVto
      const caeVto =
        vto.length === 8 ? `${vto.slice(0, 4)}-${vto.slice(4, 6)}-${vto.slice(6, 8)}` : vto

      return {
        result: { invoice_number: nextNro, cae: response.CAE, cae_vto: caeVto, comp_tipo: cbteTipo },
        updatedSettings,
      }
    }

    // Rejected — check if it's a numbering collision and retry
    const reason = response.Errors ?? response.Observaciones ?? 'sin detalle'
    const isNumberingConflict =
      /ya.{0,5}registrado|ya fue informado|10016|10015/i.test(reason)

    if (isNumberingConflict && attempt < maxAttempts - 1) {
      // Re-fetch last number and retry
      lastNro = await feCompUltimoAutorizado(opts, settings.punto_venta, cbteTipo)
      attempt++
      continue
    }

    throw new Error(`ARCA rechazó la factura: ${reason}`)
  }

  throw new Error('ARCA: no se pudo emitir tras varios intentos')
}

/**
 * Build the QR data per ARCA standard.
 * Format: https://www.afip.gob.ar/fe/qr/?p=<base64(json)>
 * IMPORTANT: standard base64, not base64url.
 */
export function buildArcaQRData(params: {
  cuit: string
  fecha: string // YYYY-MM-DD
  ptoVta: number
  cbteTipo: number
  cbteNro: number
  importe: number
  moneda: string
  cae: string
  tipoDocRec?: number
  nroDocRec?: string
}): string {
  const json = JSON.stringify({
    ver: 1,
    fecha: params.fecha,
    cuit: parseInt(params.cuit.replace(/\D/g, '')),
    ptoVta: params.ptoVta,
    tipoCmp: params.cbteTipo,
    nroCmp: params.cbteNro,
    importe: round2(params.importe),
    moneda: params.moneda,
    ctz: 1,
    tipoDocRec: params.tipoDocRec ?? 99,
    nroDocRec: params.nroDocRec ? parseInt(params.nroDocRec) : 0,
    tipoCodAut: 'E',
    codAut: parseInt(params.cae),
  })
  // Standard base64, not base64url. The full URL is what gets encoded into the QR image.
  return `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(json).toString('base64')}`
}
