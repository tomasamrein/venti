import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPreApproval } from '@/lib/mercadopago/client'
import { createAdminClient } from '@/lib/supabase/admin'

const checkoutSchema = z.object({
  plan_type: z.enum(['basic', 'pro']),
  email: z.string().email(),
  org_id: z.string().uuid().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const json = await req.json()
    const parsed = checkoutSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.format() }, { status: 400 })
    }

    const { plan_type, email, org_id } = parsed.data
    const admin = createAdminClient()

    const { data: plan } = await admin
      .from('subscription_plans')
      .select('id, name, price_ars, mp_plan_id, is_active')
      .eq('type', plan_type)
      .single()

    if (!plan || !plan.is_active) {
      return NextResponse.json({ error: 'Plan no disponible' }, { status: 404 })
    }

    if (plan.price_ars <= 0) {
      return NextResponse.json({ error: 'Plan no requiere suscripción paga' }, { status: 400 })
    }

    // If org_id provided, validate it has no active subscription already
    if (org_id) {
      const { data: existing } = await admin
        .from('subscriptions')
        .select('status, mp_subscription_id')
        .eq('organization_id', org_id)
        .maybeSingle()

      if (existing?.status === 'active') {
        return NextResponse.json(
          { error: 'Esta organización ya tiene una suscripción activa' },
          { status: 409 }
        )
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.venti.ar'
    const preApproval = getPreApproval()

    const result = await preApproval.create({
      body: {
        preapproval_plan_id: plan.mp_plan_id ?? undefined,
        reason: `Venti ${plan.name}`,
        payer_email: email,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: plan.price_ars,
          currency_id: 'ARS',
        },
        back_url: `${appUrl}/registro/confirmacion`,
        external_reference: org_id ? `org:${org_id}:plan:${plan.id}` : `new:plan:${plan.id}`,
        status: 'pending',
      },
    })

    if (!result.id || !result.init_point) {
      return NextResponse.json({ error: 'Mercado Pago no devolvió init_point' }, { status: 502 })
    }

    return NextResponse.json({ init_point: result.init_point, id: result.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[checkout] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
