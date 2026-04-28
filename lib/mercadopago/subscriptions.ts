import { getPreApproval, getPreApprovalPlan } from './client'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createMpSubscription({
  orgId,
  planId,
  mpPlanId,
  payerEmail,
  backUrl,
}: {
  orgId: string
  planId: string
  mpPlanId: string
  payerEmail: string
  backUrl: string
}) {
  const preApproval = getPreApproval()

  const response = await preApproval.create({
    body: {
      preapproval_plan_id: mpPlanId,
      payer_email: payerEmail,
      back_url: backUrl,
      status: 'pending',
    },
  })

  if (!response.id) throw new Error('MP no devolvió ID de suscripción')

  const supabase = createAdminClient()
  await supabase.from('subscriptions').upsert(
    {
      organization_id: orgId,
      plan_id: planId,
      status: 'trialing',
      mp_subscription_id: response.id,
      mp_payer_id: response.payer_id?.toString() ?? null,
    },
    { onConflict: 'organization_id' }
  )

  return {
    subscriptionId: response.id,
    initPoint: response.init_point,
  }
}

export async function cancelMpSubscription(mpSubscriptionId: string) {
  const preApproval = getPreApproval()
  await preApproval.update({
    id: mpSubscriptionId,
    body: { status: 'cancelled' },
  })

  const supabase = createAdminClient()
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('mp_subscription_id', mpSubscriptionId)
}

export async function getMpSubscriptionStatus(mpSubscriptionId: string) {
  const preApproval = getPreApproval()
  const response = await preApproval.get({ id: mpSubscriptionId })
  return response.status
}

export async function createMpPlan({
  name,
  amountARS,
  intervalMonths = 1,
}: {
  name: string
  amountARS: number
  intervalMonths?: number
}) {
  const plan = getPreApprovalPlan()
  const response = await plan.create({
    body: {
      reason: name,
      auto_recurring: {
        frequency: intervalMonths,
        frequency_type: 'months',
        transaction_amount: amountARS,
        currency_id: 'ARS',
      },
      back_url: process.env.NEXT_PUBLIC_APP_URL!,
    },
  })
  return response
}
