import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getArcaToken } from '@/lib/arca/auth'
import { feCompUltimoAutorizado, fecaeSolicitar } from '@/lib/arca/client'
import { buildArcaQRData } from '@/lib/arca/invoice'
import type { ArcaSettings } from '@/types/arca'

// Original factura tipo → Nota de Crédito tipo
const NC_TIPO: Record<number, number> = { 1: 3, 6: 8, 11: 13 }

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { invoice_id } = await req.json() as { invoice_id: string }
    if (!invoice_id) return NextResponse.json({ error: 'Falta invoice_id' }, { status: 400 })

    const admin = createAdminClient()

    const { data: invoice } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
      .single()

    if (!invoice) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    if (invoice.status !== 'issued') {
      return NextResponse.json({ error: 'Solo se pueden anular facturas emitidas' }, { status: 422 })
    }
    if (!invoice.afip_comp_nro || !invoice.afip_comp_tipo || !invoice.afip_punto_venta) {
      return NextResponse.json({ error: 'La factura no tiene datos ARCA completos' }, { status: 422 })
    }

    // Verify caller is member of the org
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', invoice.organization_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const ncTipo = NC_TIPO[invoice.afip_comp_tipo]
    if (!ncTipo) {
      return NextResponse.json({ error: `No hay Nota de Crédito para comp tipo ${invoice.afip_comp_tipo}` }, { status: 422 })
    }

    const { data: org } = await admin
      .from('organizations')
      .select('settings, cuit')
      .eq('id', invoice.organization_id)
      .single()

    const arcaDb = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
    if (!arcaDb?.vault_cert_id) {
      return NextResponse.json({ error: 'Credenciales ARCA no configuradas' }, { status: 422 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vaultCreds, error: vaultErr } = await (admin.rpc as any)('get_arca_cert_key', {
      p_org_id: invoice.organization_id,
    })
    if (vaultErr || !vaultCreds) {
      return NextResponse.json({ error: 'Error al leer credenciales ARCA' }, { status: 500 })
    }
    const { cert_pem, key_pem } = Array.isArray(vaultCreds) ? vaultCreds[0] : vaultCreds
    if (!cert_pem || !key_pem) {
      return NextResponse.json({ error: 'Credenciales ARCA incompletas' }, { status: 422 })
    }

    const arcaSettings: ArcaSettings = { ...arcaDb, cert_pem, key_pem }
    const { token, updatedSettings } = await getArcaToken(arcaSettings)
    const opts = { cuit: arcaSettings.cuit, token, env: arcaSettings.environment }

    const lastNro = await feCompUltimoAutorizado(opts, arcaSettings.punto_venta, ncTipo)
    const nextNro = lastNro + 1

    const today = new Date()
    const arOffset = -3 * 60
    const local = new Date(today.getTime() + (arOffset - today.getTimezoneOffset()) * 60000)
    const cbteFch = local.toISOString().slice(0, 10).replace(/-/g, '')

    const isFacturaC = ncTipo === 13
    const total = Number(invoice.total)
    const impNeto = isFacturaC ? total : Number(invoice.subtotal)
    const impIva = isFacturaC ? 0 : Number(invoice.tax_amount)

    const response = await fecaeSolicitar(opts, {
      CantReg: 1,
      PtoVta: arcaSettings.punto_venta,
      CbteTipo: ncTipo,
      Concepto: 1,
      DocTipo: invoice.customer_cuit?.replace(/\D/g, '').length === 11 ? 80 : 99,
      DocNro: invoice.customer_cuit?.replace(/\D/g, '') || '0',
      CbteDesde: nextNro,
      CbteHasta: nextNro,
      CbteFch: cbteFch,
      ImpTotal: total,
      ImpTotConc: 0,
      ImpNeto: impNeto,
      ImpOpEx: 0,
      ImpTrib: 0,
      ImpIVA: impIva,
      MonId: 'PES',
      MonCotiz: 1,
      Iva: isFacturaC ? [] : [{ Id: 5, BaseImp: impNeto, Importe: impIva }],
      CondicionIVAReceptorId: invoice.customer_cuit ? 1 : 5,
      CbtesAsoc: [{ Tipo: invoice.afip_comp_tipo, PtoVta: invoice.afip_punto_venta, Nro: invoice.afip_comp_nro }],
    })

    if (response.Resultado !== 'A') {
      throw new Error(`ARCA rechazó la NC: ${response.Errors ?? response.Observaciones ?? 'sin detalle'}`)
    }

    const vto = response.CAEFchVto
    const caeVto = vto.length === 8 ? `${vto.slice(0, 4)}-${vto.slice(4, 6)}-${vto.slice(6, 8)}` : vto

    const qrData = buildArcaQRData({
      cuit: arcaSettings.cuit,
      fecha: local.toISOString().slice(0, 10),
      ptoVta: arcaSettings.punto_venta,
      cbteTipo: ncTipo,
      cbteNro: nextNro,
      importe: total,
      moneda: 'PES',
      cae: response.CAE,
      tipoDocRec: invoice.customer_cuit ? 80 : 99,
      nroDocRec: invoice.customer_cuit?.replace(/\D/g, '') || '0',
    })

    // Create the NC invoice record and void the original
    const [{ data: ncInvoice }, , { cert_pem: _c, key_pem: _k, ...cacheableSettings }] = await Promise.all([
      admin.from('invoices').insert({
        organization_id: invoice.organization_id,
        branch_id: invoice.branch_id,
        customer_id: invoice.customer_id,
        invoice_type: invoice.invoice_type,
        status: 'issued',
        cae: response.CAE,
        cae_vto: caeVto,
        afip_punto_venta: arcaSettings.punto_venta,
        afip_comp_nro: nextNro,
        afip_comp_tipo: ncTipo,
        customer_name: invoice.customer_name,
        customer_cuit: invoice.customer_cuit,
        customer_address: invoice.customer_address,
        subtotal: invoice.subtotal,
        tax_amount: invoice.tax_amount,
        total: invoice.total,
        items: invoice.items,
        qr_data: qrData,
        issued_at: new Date().toISOString(),
      }).select().single(),
      admin.from('invoices').update({ status: 'voided' }).eq('id', invoice_id),
      Promise.resolve(updatedSettings),
    ])

    // Cache updated token
    const { cert_pem: _cc, key_pem: _kk, ...cs } = updatedSettings
    await admin
      .from('organizations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ settings: { ...(org!.settings as object), arca: cs } as any })
      .eq('id', invoice.organization_id)

    return NextResponse.json({ credit_note: ncInvoice, cae: response.CAE })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
