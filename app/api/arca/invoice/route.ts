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

    // Server-side total validation — never trust the client's number for fiscal docs
    const computedTotal = invoiceReq.items.reduce((sum, i) => sum + i.subtotal, 0)
    const roundedComputed = Math.round(computedTotal * 100) / 100
    const roundedSent = Math.round(invoiceReq.total * 100) / 100
    if (Math.abs(roundedComputed - roundedSent) > 0.02) {
      return NextResponse.json(
        { error: `Total inválido: calculado ${roundedComputed}, recibido ${roundedSent}` },
        { status: 422 }
      )
    }
    // Override with server-computed values to be safe
    invoiceReq.total = roundedComputed
    invoiceReq.subtotal = Math.round(invoiceReq.items.reduce((s, i) => s + i.subtotal / (1 + (i.tax_rate ?? 21) / 100), 0) * 100) / 100

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

    // Plan gate: Simple no incluye facturación ARCA
    const { data: sub } = await admin
      .from('subscriptions')
      .select('subscription_plans(type)')
      .eq('organization_id', invoiceReq.org_id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    const planType = (sub?.subscription_plans as { type?: string } | null)?.type ?? null
    if (planType === 'basic' || planType === 'basic_annual') {
      return NextResponse.json(
        { error: 'Tu plan Simple no incluye facturación ARCA. Actualizá a Avanzado para habilitarla.' },
        { status: 402 }
      )
    }

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

    const arcaDb = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
    if (!arcaDb?.vault_cert_id) {
      return NextResponse.json({ error: 'Credenciales ARCA no configuradas' }, { status: 422 })
    }

    // Fetch cert+key from vault (never stored in settings after migration)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: vaultCreds, error: vaultErr } = await (admin.rpc as any)('get_arca_cert_key', {
      p_org_id: invoiceReq.org_id,
    })
    if (vaultErr || !vaultCreds) {
      return NextResponse.json({ error: 'Error al leer credenciales ARCA' }, { status: 500 })
    }
    const { cert_pem, key_pem } = Array.isArray(vaultCreds) ? vaultCreds[0] : vaultCreds
    if (!cert_pem || !key_pem) {
      return NextResponse.json({ error: 'Credenciales ARCA incompletas en vault' }, { status: 422 })
    }
    const arcaSettings: ArcaSettings = { ...arcaDb, cert_pem, key_pem }

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

    // Persist updated token cache — strip cert/key, they live in vault
    const { cert_pem: _c, key_pem: _k, ...cacheableSettings } = updatedSettings
    await admin
      .from('organizations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ settings: { ...(org!.settings as object), arca: cacheableSettings } as any })
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
