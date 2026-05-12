import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { emitInvoice, buildArcaQRData } from '@/lib/arca/invoice'
import type { ArcaSettings } from '@/types/arca'

function getAdminArcaSettings(): ArcaSettings {
  const cuit = process.env.ADMIN_ARCA_CUIT
  const ptoVenta = process.env.ADMIN_ARCA_PUNTO_VENTA
  const certB64 = process.env.ADMIN_ARCA_CERT_PEM
  const keyB64 = process.env.ADMIN_ARCA_KEY_PEM
  const env = (process.env.ADMIN_ARCA_ENVIRONMENT ?? 'production') as 'homologation' | 'production'

  if (!cuit || !ptoVenta || !certB64 || !keyB64) {
    throw new Error('Credenciales ARCA del admin no configuradas (ADMIN_ARCA_*)')
  }

  // Stored as base64 in env to avoid newline issues
  const cert_pem = Buffer.from(certB64, 'base64').toString('utf-8')
  const key_pem = Buffer.from(keyB64, 'base64').toString('utf-8')

  return {
    cuit,
    punto_venta: parseInt(ptoVenta, 10),
    environment: env,
    cert_pem,
    key_pem,
  }
}

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

    const body = await req.json() as {
      client_org_id?: string
      amount: number
      description?: string
      customer_name?: string
      customer_cuit?: string
    }
    const { client_org_id, amount, description, customer_name, customer_cuit } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Importe inválido' }, { status: 400 })
    }

    let arcaSettings: ArcaSettings
    try {
      arcaSettings = getAdminArcaSettings()
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 422 })
    }

    const total = Math.round(amount * 100) / 100

    const invoiceReq = {
      org_id: process.env.ADMIN_ORG_ID ?? 'admin',
      branch_id: process.env.ADMIN_BRANCH_ID ?? 'admin',
      invoice_type: 'C' as const,
      customer_name: customer_name ?? undefined,
      customer_cuit: customer_cuit ?? undefined,
      items: [{
        description: description || 'Suscripción Ventix',
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

    // Save draft to admin's own org if env vars are set
    const adminOrgId = process.env.ADMIN_ORG_ID
    const adminBranchId = process.env.ADMIN_BRANCH_ID
    let draftId: string | null = null

    if (adminOrgId && adminBranchId) {
      const { data: draft } = await admin
        .from('invoices')
        .insert({
          organization_id: adminOrgId,
          branch_id: adminBranchId,
          invoice_type: 'C',
          status: 'draft',
          afip_punto_venta: arcaSettings.punto_venta,
          customer_name: customer_name ?? null,
          customer_cuit: customer_cuit ?? null,
          subtotal: total,
          tax_amount: 0,
          total,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: invoiceReq.items as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .select('id')
        .single()
      draftId = draft?.id ?? null
    }

    let result, updatedSettings
    try {
      const r = await emitInvoice(arcaSettings, invoiceReq)
      result = r.result
      updatedSettings = r.updatedSettings
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error ARCA'
      if (draftId) await admin.from('invoices').update({ status: 'canceled' }).eq('id', draftId)
      return NextResponse.json({ error: message }, { status: 502 })
    }

    // Cache updated token in admin org settings
    if (adminOrgId) {
      const { data: adminOrg } = await admin
        .from('organizations')
        .select('settings')
        .eq('id', adminOrgId)
        .single()

      const { cert_pem: _c, key_pem: _k, ...cacheableSettings } = updatedSettings
      await admin
        .from('organizations')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ settings: { ...(adminOrg?.settings as object ?? {}), arca: cacheableSettings } as any })
        .eq('id', adminOrgId)
    }

    const today = new Date().toISOString().slice(0, 10)
    const { docTipo, docNro } = resolveDocForQr(customer_cuit)
    const qrData = buildArcaQRData({
      cuit: arcaSettings.cuit,
      fecha: today,
      ptoVta: arcaSettings.punto_venta,
      cbteTipo: result.comp_tipo,
      cbteNro: result.invoice_number,
      importe: total,
      moneda: 'PES',
      cae: result.cae,
      tipoDocRec: docTipo,
      nroDocRec: docNro,
    })

    if (draftId) {
      await admin
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
        .eq('id', draftId)
    }

    return NextResponse.json({ result, qr_data: qrData, client_org_id: client_org_id ?? null })
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
