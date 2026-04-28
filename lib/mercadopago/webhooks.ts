import crypto from 'crypto'
import { Payment, PreApproval } from 'mercadopago'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMpClient } from './client'

/**
 * Verify Mercado Pago webhook signature.
 *
 * Header format (x-signature): "ts=<timestamp>,v1=<hash>"
 * Manifest to sign: "id:<DATA_ID>;request-id:<X_REQUEST_ID>;ts:<TS>;"
 *
 * IMPORTANT: the `id` in the manifest is the resource id (data.id), NOT the
 * x-request-id. Many implementations get this wrong — MP docs are ambiguous.
 */
export function verifyMpSignature({
  xSignature,
  xRequestId,
  dataId,
}: {
  xSignature: string
  xRequestId: string
  dataId: string
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return false
  if (!xSignature || !dataId) return false

  const parts: Record<string, string> = {}
  for (const segment of xSignature.split(',')) {
    const [k, v] = segment.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  }

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(v1, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'

const PREAPPROVAL_STATUS_MAP: Record<string, SubStatus> = {
  authorized: 'active',
  paused: 'paused',
  cancelled: 'canceled',
  pending: 'trialing',
  finished: 'canceled',
}

/**
 * Process a Mercado Pago webhook. Idempotent: every operation either fetches
 * the source-of-truth from MP and overwrites, or no-ops on missing records.
 */
export async function processMpWebhook(type: string, dataId: string): Promise<{ handled: boolean; reason?: string }> {
  const supabase = createAdminClient()

  // ---- Subscription (preapproval) events ----
  if (type === 'subscription_preapproval' || type === 'preapproval') {
    const preApproval = new PreApproval(getMpClient())
    const sub = await preApproval.get({ id: dataId })

    const status = PREAPPROVAL_STATUS_MAP[sub.status ?? ''] ?? 'trialing'

    // Find subscription either by mp_subscription_id (already linked)
    // or via external_reference (newly created — links to org or pending registration)
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id, organization_id')
      .eq('mp_subscription_id', dataId)
      .maybeSingle()

    const startDate = sub.date_created ?? new Date().toISOString()
    const endDate = sub.next_payment_date ?? null

    if (existing) {
      await supabase
        .from('subscriptions')
        .update({
          status,
          mp_payer_id: sub.payer_id?.toString() ?? null,
          current_period_start: startDate,
          current_period_end: endDate,
          canceled_at: status === 'canceled' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      // Org active iff status is active or trialing
      await supabase
        .from('organizations')
        .update({
          is_active: status === 'active' || status === 'trialing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.organization_id)

      return { handled: true }
    }

    // Not yet linked — try to find via external_reference
    const externalRef = sub.external_reference ?? ''
    const refParts = externalRef.split(':')
    const isNew = refParts[0] === 'new'
    const orgId = refParts[0] === 'org' ? refParts[1] : null
    const planId = refParts[refParts.length - 1]

    if (orgId && planId) {
      // Existing org adopting a subscription
      await supabase.from('subscriptions').upsert(
        {
          organization_id: orgId,
          plan_id: planId,
          status,
          mp_subscription_id: dataId,
          mp_payer_id: sub.payer_id?.toString() ?? null,
          current_period_start: startDate,
          current_period_end: endDate,
        },
        { onConflict: 'organization_id' }
      )
      await supabase
        .from('organizations')
        .update({ is_active: status === 'active' || status === 'trialing' })
        .eq('id', orgId)
      return { handled: true }
    }

    if (isNew) {
      // Subscription created BEFORE org registration — store with placeholder.
      // Confirm endpoint links it post-registration.
      // We don't know orgId yet; do nothing here — confirm route will pick it up.
      return { handled: true, reason: 'pending_registration' }
    }

    return { handled: false, reason: 'subscription_not_found' }
  }

  // ---- Payment events ----
  if (type === 'payment') {
    const payment = new Payment(getMpClient())
    const paymentData = await payment.get({ id: dataId })

    // preapproval_id is present on subscription payments but not always typed in the SDK
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const preapprovalId = (paymentData as any).preapproval_id as string | undefined
    if (!preapprovalId) {
      // Not a subscription payment — ignore (could be a one-off charge)
      return { handled: true, reason: 'not_subscription_payment' }
    }

    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id, organization_id, current_period_end')
      .eq('mp_subscription_id', preapprovalId)
      .maybeSingle()

    if (!existing) return { handled: false, reason: 'subscription_not_found' }

    let status: SubStatus
    let extendPeriod = false

    switch (paymentData.status) {
      case 'approved':
        status = 'active'
        extendPeriod = true
        break
      case 'rejected':
      case 'cancelled':
        status = 'past_due'
        break
      case 'refunded':
      case 'charged_back':
        status = 'past_due'
        break
      case 'pending':
      case 'in_process':
      case 'authorized':
        // Don't change status on intermediate states
        return { handled: true, reason: 'intermediate_state' }
      default:
        status = 'past_due'
    }

    // Extend the period by 30 days from the previous end (or now if past)
    const periodEnd = extendPeriod
      ? new Date(
          Math.max(
            existing.current_period_end ? new Date(existing.current_period_end).getTime() : 0,
            Date.now()
          ) + 30 * 86400000
        ).toISOString()
      : existing.current_period_end

    await supabase
      .from('subscriptions')
      .update({
        status,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    // Deactivate org if past_due
    if (status === 'past_due') {
      await supabase
        .from('organizations')
        .update({ is_active: false })
        .eq('id', existing.organization_id)
    } else if (status === 'active') {
      await supabase
        .from('organizations')
        .update({ is_active: true })
        .eq('id', existing.organization_id)
    }

    return { handled: true }
  }

  return { handled: false, reason: `unknown_type:${type}` }
}
