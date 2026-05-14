import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { InvoiceRequest } from '@/types/arca'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = (await req.json()) as InvoiceRequest
    if (body.invoice_type !== 'ticket' && body.invoice_type !== 'non_fiscal') {
      return NextResponse.json({ error: 'Tipo inválido para este endpoint' }, { status: 400 })
    }
    if (!body.items?.length) {
      return NextResponse.json({ error: 'Debe incluir al menos un ítem' }, { status: 400 })
    }

    const computed = body.items.reduce((s, i) => s + i.subtotal, 0)
    const total = Math.round(computed * 100) / 100

    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', body.org_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    if (!member) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    // Idempotency by sale_id
    if (body.sale_id) {
      const { data: existing } = await supabase
        .from('invoices')
        .select('*')
        .eq('sale_id', body.sale_id)
        .eq('status', 'issued')
        .maybeSingle()
      if (existing) return NextResponse.json({ invoice: existing, idempotent: true })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: nextNumber, error: seqErr } = await (supabase.rpc as any)('next_non_fiscal_number', {
      p_org_id: body.org_id,
      p_branch_id: body.branch_id,
      p_type: body.invoice_type,
    })
    if (seqErr) {
      return NextResponse.json({ error: 'No se pudo generar número: ' + seqErr.message }, { status: 500 })
    }

    const admin = createAdminClient()
    const { data: invoice, error: insertErr } = await admin
      .from('invoices')
      .insert({
        sale_id: body.sale_id ?? null,
        organization_id: body.org_id,
        branch_id: body.branch_id,
        customer_id: body.customer_id ?? null,
        invoice_type: body.invoice_type,
        status: 'issued',
        afip_comp_nro: nextNumber as number,
        customer_name: body.customer_name ?? null,
        customer_cuit: body.customer_cuit ?? null,
        customer_address: body.customer_address ?? null,
        subtotal: total,
        tax_amount: 0,
        total,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: body.items as any,
        issued_at: new Date().toISOString(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any)
      .select()
      .single()

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    return NextResponse.json({ invoice })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
