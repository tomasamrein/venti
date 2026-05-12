import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emitInvoice, buildArcaQRData } from '@/lib/arca/invoice'
import type { ArcaSettings } from '@/types/arca'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminClient()

    const { data: profile } = await admin
      .from('profiles')
      .select('is_super_admin')
      .eq('id', user.id)
      .single()

    if (!profile?.is_super_admin) {
      return NextResponse.json({ error: 'Solo super-admin' }, { status: 403 })
    }

    const body = await req.json() as { org_id: string; amount: number; description?: string }
    const { org_id, amount, description } = body

    if (!org_id || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const { data: branch } = await admin
      .from('branches')
      .select('id')
      .eq('organization_id', org_id)
      .eq('is_active', true)
      .order('is_main', { ascending: false })
      .limit(1)
      .single()

    if (!branch) {
      return NextResponse.json({ error: 'No hay sucursal activa' }, { status: 422 })
    }

    const { data: org } = await admin
      .from('organizations')
      .select('settings, cuit')
      .eq('id', org_id)
      .single()

    const arcaDb = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
    if (!arcaDb?.vault_cert_id) {
      return NextResponse.json({ error: 'Credenciales ARCA no configuradas para esta org' }, { status: 422 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vaultCreds, error: vaultErr } = await (admin.rpc as any)('get_arca_cert_key', {
      p_org_id: org_id,
    })
    if (vaultErr || !vaultCreds) {
      return NextResponse.json({ error: 'Error al leer credenciales ARCA del vault' }, { status: 500 })
    }
    const { cert_pem, key_pem } = Array.isArray(vaultCreds) ? vaultCreds[0] : vaultCreds
    if (!cert_pem || !key_pem) {
      return NextResponse.json({ error: 'Credenciales ARCA incompletas en vault' }, { status: 422 })
    }

    const arcaSettings: ArcaSettings = { ...arcaDb, cert_pem, key_pem }
    const total = Math.round(amount * 100) / 100

    const invoiceReq = {
      org_id,
      branch_id: branch.id,
      invoice_type: 'C' as const,
      items: [{
        description: description || 'Servicios',
        quantity: 1,
        unit_price: total,
        discount_pct: 0,
        tax_rate: 0,
        subtotal: total,
      }],
      subtotal: total,
      tax_amount: 0,
      total,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: draft, error: draftErr } = await admin
      .from('invoices')
      .insert({
        organization_id: org_id,
        branch_id: branch.id,
        invoice_type: 'C',
        status: 'draft',
        afip_punto_venta: arcaSettings.punto_venta,
        subtotal: total,
        tax_amount: 0,
        total,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: invoiceReq.items as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single()

    if (draftErr || !draft) {
      return NextResponse.json({ error: 'No se pudo crear el borrador' }, { status: 500 })
    }

    let result, updatedSettings
    try {
      const r = await emitInvoice(arcaSettings, invoiceReq)
      result = r.result
      updatedSettings = r.updatedSettings
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error ARCA'
      await admin.from('invoices').update({ status: 'canceled' }).eq('id', draft.id)
      return NextResponse.json({ error: message }, { status: 502 })
    }

    const { cert_pem: _c, key_pem: _k, ...cacheableSettings } = updatedSettings
    await admin
      .from('organizations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ settings: { ...(org!.settings as object), arca: cacheableSettings } as any })
      .eq('id', org_id)

    const today = new Date().toISOString().slice(0, 10)
    const qrData = buildArcaQRData({
      cuit: arcaSettings.cuit,
      fecha: today,
      ptoVta: arcaSettings.punto_venta,
      cbteTipo: result.comp_tipo,
      cbteNro: result.invoice_number,
      importe: total,
      moneda: 'PES',
      cae: result.cae,
      tipoDocRec: 99,
      nroDocRec: '0',
    })

    const { data: invoice } = await admin
      .from('invoices')
      .update({
        status: 'issued',
        cae: result.cae,
        cae_vto: result.cae_vto,
        afip_comp_nro: result.invoice_number,
        afip_comp_tipo: result.comp_tipo,
        qr_data: qrData,
        issued_at: new Date().toISOString(),
      })
      .eq('id', draft.id)
      .select()
      .single()

    return NextResponse.json({ invoice, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
