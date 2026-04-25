import { NextRequest, NextResponse } from 'next/server'
import { getPreApproval } from '@/lib/mercadopago/client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { plan_type, email, org_id } = await req.json() as {
      plan_type: 'basic' | 'pro'
      email: string
      org_id?: string
    }

    if (!plan_type || !email) {
      return NextResponse.json({ error: 'plan_type y email son requeridos' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data: plan } = await admin
      .from('subscription_plans')
      .select('id, name, price_ars, mp_plan_id')
      .eq('type', plan_type)
      .single()

    if (!plan) return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 })

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

    return NextResponse.json({ init_point: result.init_point, id: result.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
