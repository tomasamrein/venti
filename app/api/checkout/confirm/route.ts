import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPreApproval } from '@/lib/mercadopago/client'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { preapproval_id, org_id } = await req.json() as { preapproval_id: string; org_id: string }
    if (!preapproval_id || !org_id) return NextResponse.json({ error: 'Parámetros requeridos' }, { status: 400 })

    // Verify org ownership
    const admin = createAdminClient()
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('organization_id', org_id)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (!member) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    // Fetch preapproval from MP
    const preApproval = getPreApproval()
    const sub = await preApproval.get({ id: preapproval_id })

    // Find plan from external_reference
    const externalRef = sub.external_reference ?? ''
    const planId = externalRef.split(':').pop() ?? ''

    const statusMap: Record<string, string> = {
      authorized: 'active',
      paused: 'paused',
      cancelled: 'canceled',
      pending: 'trialing',
    }
    const dbStatus = statusMap[sub.status ?? ''] ?? 'trialing'

    // Upsert subscription
    const { data: existing } = await admin
      .from('subscriptions')
      .select('id')
      .eq('organization_id', org_id)
      .single()

    if (existing) {
      await admin.from('subscriptions').update({
        plan_id: planId,
        status: dbStatus as 'active',
        mp_subscription_id: preapproval_id,
        mp_payer_id: String(sub.payer_id ?? ''),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id)
    } else {
      await admin.from('subscriptions').insert({
        organization_id: org_id,
        plan_id: planId,
        status: dbStatus as 'active',
        mp_subscription_id: preapproval_id,
        mp_payer_id: String(sub.payer_id ?? ''),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
      })
    }

    // Activate org
    await admin.from('organizations').update({ is_active: true }).eq('id', org_id)

    return NextResponse.json({ ok: true, status: dbStatus })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
