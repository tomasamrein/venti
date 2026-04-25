import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emitInvoice, buildArcaQRData } from '@/lib/arca/invoice'
import type { ArcaSettings, InvoiceRequest } from '@/types/arca'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const invoiceReq = (await req.json()) as InvoiceRequest

    // Verify membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', invoiceReq.org_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!member) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const admin = createAdminClient()
    const { data: org } = await admin
      .from('organizations')
      .select('settings, cuit')
      .eq('id', invoiceReq.org_id)
      .single()

    const arcaSettings = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
    if (!arcaSettings?.cert_pem || !arcaSettings?.key_pem) {
      return NextResponse.json({ error: 'Credenciales ARCA no configuradas' }, { status: 422 })
    }

    // Emit invoice via ARCA
    const { result, updatedSettings } = await emitInvoice(arcaSettings, invoiceReq)

    // Persist updated token cache
    await admin
      .from('organizations')
      .update({ settings: { ...(org!.settings as object), arca: updatedSettings } as any })
      .eq('id', invoiceReq.org_id)

    // Build QR data
    const today = new Date().toISOString().slice(0, 10)
    const qrData = buildArcaQRData({
      cuit: arcaSettings.cuit,
      fecha: today,
      ptoVta: arcaSettings.punto_venta,
      cbteTipo: result.comp_tipo,
      cbteNro: result.invoice_number,
      importe: invoiceReq.total,
      moneda: 'PES',
      cae: result.cae,
    })

    // Persist invoice to DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invoice, error: insertErr } = await admin
      .from('invoices')
      .insert({
        sale_id: invoiceReq.sale_id ?? null,
        organization_id: invoiceReq.org_id,
        branch_id: invoiceReq.branch_id,
        customer_id: invoiceReq.customer_id ?? null,
        invoice_type: invoiceReq.invoice_type,
        status: 'issued',
        cae: result.cae,
        cae_vto: result.cae_vto,
        afip_punto_venta: arcaSettings.punto_venta,
        afip_comp_nro: result.invoice_number,
        afip_comp_tipo: result.comp_tipo,
        customer_name: invoiceReq.customer_name ?? null,
        customer_cuit: invoiceReq.customer_cuit ?? null,
        customer_address: invoiceReq.customer_address ?? null,
        subtotal: invoiceReq.subtotal,
        tax_amount: invoiceReq.tax_amount,
        total: invoiceReq.total,
        items: invoiceReq.items as unknown as never,
        qr_data: qrData,
        issued_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single()

    if (insertErr) throw insertErr

    return NextResponse.json({ invoice, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
