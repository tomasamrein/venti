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

    // Verify membership (RLS would also block, but we want a clear 403)
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', invoiceReq.org_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!member) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    const admin = createAdminClient()

    // Idempotency: if this sale already has an issued invoice, return it
    if (invoiceReq.sale_id) {
      const { data: existing } = await admin
        .from('invoices')
        .select('*')
        .eq('sale_id', invoiceReq.sale_id)
        .eq('status', 'issued')
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ invoice: existing, idempotent: true })
      }
    }

    const { data: org } = await admin
      .from('organizations')
      .select('settings, cuit')
      .eq('id', invoiceReq.org_id)
      .single()

    const arcaSettings = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
    if (!arcaSettings?.cert_pem || !arcaSettings?.key_pem) {
      return NextResponse.json({ error: 'Credenciales ARCA no configuradas' }, { status: 422 })
    }

    // Pre-create draft invoice so we have a stable id even if persistence fails after CAE
    const { data: draft, error: draftErr } = await admin
      .from('invoices')
      .insert({
        sale_id: invoiceReq.sale_id ?? null,
        organization_id: invoiceReq.org_id,
        branch_id: invoiceReq.branch_id,
        customer_id: invoiceReq.customer_id ?? null,
        invoice_type: invoiceReq.invoice_type,
        status: 'draft',
        afip_punto_venta: arcaSettings.punto_venta,
        customer_name: invoiceReq.customer_name ?? null,
        customer_cuit: invoiceReq.customer_cuit ?? null,
        customer_address: invoiceReq.customer_address ?? null,
        subtotal: invoiceReq.subtotal,
        tax_amount: invoiceReq.tax_amount,
        total: invoiceReq.total,
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
      // Mark draft as canceled with error info to avoid orphaned drafts
      const message = err instanceof Error ? err.message : 'Error desconocido'
      await admin
        .from('invoices')
        .update({
          status: 'canceled',
          customer_address: `[Error ARCA] ${message.slice(0, 200)}`,
        })
        .eq('id', draft.id)
      return NextResponse.json({ error: message, draft_id: draft.id }, { status: 502 })
    }

    // Persist updated token cache (best-effort)
    await admin
      .from('organizations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ settings: { ...(org!.settings as object), arca: updatedSettings } as any })
      .eq('id', invoiceReq.org_id)

    const today = new Date().toISOString().slice(0, 10)
    const { docTipo, docNro } = resolveDocForQr(invoiceReq.customer_cuit)
    const qrData = buildArcaQRData({
      cuit: arcaSettings.cuit,
      fecha: today,
      ptoVta: arcaSettings.punto_venta,
      cbteTipo: result.comp_tipo,
      cbteNro: result.invoice_number,
      importe: invoiceReq.total,
      moneda: 'PES',
      cae: result.cae,
      tipoDocRec: docTipo,
      nroDocRec: docNro,
    })

    const { data: invoice, error: updateErr } = await admin
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

    if (updateErr) throw updateErr

    return NextResponse.json({ invoice, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function resolveDocForQr(customerCuit?: string): { docTipo: number; docNro: string } {
  if (!customerCuit) return { docTipo: 99, docNro: '0' }
  const digits = customerCuit.replace(/\D/g, '')
  if (digits.length === 11) return { docTipo: 80, docNro: digits }
  if (digits.length === 8 || digits.length === 7) return { docTipo: 96, docNro: digits }
  return { docTipo: 99, docNro: '0' }
}
