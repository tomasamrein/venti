import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  org_name: z.string().min(2),
  org_slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  branch_name: z.string().min(2),
  trial_days: z.number().min(1).max(365).default(14),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Solo super-admins' }, { status: 403 })
  }

  const body = await request.json()
  const data = schema.parse(body)

  const admin = createAdminClient()

  const { data: existingOrg } = await admin
    .from('organizations')
    .select('id')
    .eq('slug', data.org_slug)
    .maybeSingle()

  if (existingOrg) {
    return NextResponse.json({ error: 'Ya existe un negocio con esa URL.' }, { status: 409 })
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    user_metadata: { full_name: data.full_name },
    email_confirm: true,
  })

  if (authError || !authData?.user) {
    return NextResponse.json({ error: authError?.message || 'Error al crear el usuario' }, { status: 400 })
  }

  const userId = authData.user.id

  const trialEnds = new Date()
  trialEnds.setDate(trialEnds.getDate() + data.trial_days)

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: data.org_name, slug: data.org_slug, trial_ends_at: trialEnds.toISOString() })
    .select('id')
    .single()

  if (orgError || !org) {
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'Error al crear el negocio' }, { status: 500 })
  }

  const { data: branch, error: branchError } = await admin
    .from('branches')
    .insert({ organization_id: org.id, name: data.branch_name, is_main: true })
    .select('id')
    .single()

  if (branchError || !branch) {
    await admin.auth.admin.deleteUser(userId)
    await admin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: 'Error al crear la sucursal' }, { status: 500 })
  }

  await admin.from('organization_members').insert({
    organization_id: org.id,
    user_id: userId,
    role: 'owner',
    branch_id: branch.id,
    joined_at: new Date().toISOString(),
  })

  try {
    const { data: plan } = await admin
      .from('subscription_plans')
      .select('id')
      .eq('type', 'free_trial')
      .maybeSingle()
    if (plan) {
      await admin.from('subscriptions').insert({
        organization_id: org.id,
        plan_id: plan.id,
        status: 'trialing',
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnds.toISOString(),
      })
    }
  } catch {}

  return NextResponse.json({ success: true, slug: data.org_slug, userId, org_id: org.id })
}
