import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const BUSINESS_TYPES = ['kiosco', 'almacen', 'drugstore', 'fotocopiadora', 'otro'] as const

const schema = z.object({
  org_name: z.string().min(2),
  org_slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
  branch_name: z.string().min(2),
  business_type: z.enum(BUSINESS_TYPES).default('kiosco'),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const data = schema.parse(body)

  const admin = createAdminClient()

  const { data: existingOrg } = await admin.from('organizations').select('id').eq('slug', data.org_slug).maybeSingle()
  if (existingOrg) return NextResponse.json({ error: 'Ya existe un negocio con esa URL. Probá con otra.' }, { status: 409 })

  const trialEnds = new Date()
  trialEnds.setDate(trialEnds.getDate() + 14)

  const { data: org, error: orgError } = await admin.from('organizations').insert({
    name: data.org_name,
    slug: data.org_slug,
    business_type: data.business_type,
    trial_ends_at: trialEnds.toISOString(),
  }).select('id').single()

  if (orgError || !org) return NextResponse.json({ error: 'Error al crear el negocio.' }, { status: 500 })

  const { data: branch, error: branchError } = await admin.from('branches').insert({
    organization_id: org.id, name: data.branch_name, is_main: true,
  }).select('id').single()

  if (branchError || !branch) {
    await admin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: 'Error al crear la sucursal.' }, { status: 500 })
  }

  const { error: memberError } = await admin.from('organization_members').insert({
    organization_id: org.id,
    user_id: user.id,
    role: 'owner',
    branch_id: branch.id,
    joined_at: new Date().toISOString(),
  })

  if (memberError) {
    await admin.from('organizations').delete().eq('id', org.id)
    return NextResponse.json({ error: 'Error al configurar la cuenta.' }, { status: 500 })
  }

  try {
    const { data: plan } = await admin.from('subscription_plans').select('id').eq('type', 'free_trial').maybeSingle()
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

  return NextResponse.json({ success: true, slug: data.org_slug })
}
