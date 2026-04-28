import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPreApproval } from '@/lib/mercadopago/client'

const confirmSchema = z.object({
  preapproval_id: z.string().min(1),
  org_id: z.string().uuid(),
})

const STATUS_MAP: Record<string, 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'> = {
  authorized: 'active',
  paused: 'paused',
  cancelled: 'canceled',
  pending: 'trialing',
  finished: 'canceled',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const json = await req.json()
    const parsed = confirmSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }
    const { preapproval_id, org_id } = parsed.data

    const admin = createAdminClient()

    // Only owner can confirm subscription
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('organization_id', org_id)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .eq('is_active', true)
      .single()

    if (!member) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

    // Idempotency: if this preapproval was already linked to this org, return current state
    const { data: alreadyLinked } = await admin
      .from('subscriptions')
      .select('id, status')
      .eq('mp_subscription_id', preapproval_id)
      .eq('organization_id', org_id)
      .maybeSingle()

    if (alreadyLinked) {
      return NextResponse.json({ ok: true, status: alreadyLinked.status, idempotent: true })
    }

    // Fetch from MP — source of truth for status and external_reference
    const preApproval = getPreApproval()
    const sub = await preApproval.get({ id: preapproval_id })

    if (!sub.id) {
      return NextResponse.json({ error: 'Suscripción no encontrada en Mercado Pago' }, { status: 404 })
    }

    // Validate external_reference matches this org (if it's an org-scoped reference)
    const externalRef = sub.external_reference ?? ''
    const refParts = externalRef.split(':')
    const refOrgId = refParts[0] === 'org' ? refParts[1] : null
    const planId = refParts[refParts.length - 1]

    if (refOrgId && refOrgId !== org_id) {
      return NextResponse.json(
        { error: 'La suscripción pertenece a otra organización' },
        { status: 403 }
      )
    }

    if (!planId) {
      return NextResponse.json({ error: 'external_reference inválido' }, { status: 400 })
    }

    // Validate plan exists
    const { data: plan } = await admin
      .from('subscription_plans')
      .select('id')
      .eq('id', planId)
      .single()
    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })
    }

    const dbStatus = STATUS_MAP[sub.status ?? ''] ?? 'trialing'
    const startDate = sub.date_created ?? new Date().toISOString()
    const endDate = sub.next_payment_date ?? new Date(Date.now() + 30 * 86400000).toISOString()

    await admin.from('subscriptions').upsert(
      {
        organization_id: org_id,
        plan_id: planId,
        status: dbStatus,
        mp_subscription_id: preapproval_id,
        mp_payer_id: sub.payer_id?.toString() ?? null,
        current_period_start: startDate,
        current_period_end: endDate,
        canceled_at: dbStatus === 'canceled' ? new Date().toISOString() : null,
      },
      { onConflict: 'organization_id' }
    )

    await admin
      .from('organizations')
      .update({
        is_active: dbStatus === 'active' || dbStatus === 'trialing',
        updated_at: new Date().toISOString(),
      })
      .eq('id', org_id)

    return NextResponse.json({ ok: true, status: dbStatus })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[checkout/confirm] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
