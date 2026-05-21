import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_super_admin').eq('id', user.id).single()
  if (!profile?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { subscriptionId, planId, status, currentPeriodEnd, orgId } = await req.json()
  if (!subscriptionId) return NextResponse.json({ error: 'subscriptionId required' }, { status: 400 })

  const admin = createAdminClient()

  type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'
  const update: { plan_id?: string; status?: SubStatus; updated_at: string; current_period_end?: string } = {
    updated_at: new Date().toISOString(),
  }
  if (planId) update.plan_id = planId
  if (status) update.status = status as SubStatus
  if (currentPeriodEnd) update.current_period_end = new Date(currentPeriodEnd).toISOString()

  const { error } = await admin.from('subscriptions').update(update).eq('id', subscriptionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (orgId && (status === 'active' || status === 'trialing')) {
    await admin.from('organizations').update({ is_active: true }).eq('id', orgId)
  }

  return NextResponse.json({ ok: true })
}
