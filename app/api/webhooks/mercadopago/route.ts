import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPreApproval } from '@/lib/mercadopago/client'
import crypto from 'crypto'

function verifySignature(req: NextRequest, body: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET
  if (!secret) return true // skip in dev if not set

  const signatureHeader = req.headers.get('x-signature') ?? ''
  const requestId = req.headers.get('x-request-id') ?? ''
  const urlParams = req.nextUrl.searchParams
  const dataId = urlParams.get('data.id') ?? urlParams.get('id') ?? ''

  // MP signature format: ts=<timestamp>,v1=<hash>
  const parts = Object.fromEntries(signatureHeader.split(',').map(p => p.split('=')))
  const ts = parts['ts'] ?? ''
  const v1 = parts['v1'] ?? ''

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  return expected === v1
}

export async function POST(req: NextRequest) {
  const body = await req.text()

  if (!verifySignature(req, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try { payload = JSON.parse(body) } catch { return NextResponse.json({ ok: true }) }

  const type = payload.type as string
  const dataId = (payload.data as Record<string, unknown>)?.id as string

  if (!dataId) return NextResponse.json({ ok: true })

  const admin = createAdminClient()

  // Handle subscription (preapproval) events
  if (type === 'subscription_preapproval' || type === 'preapproval') {
    const preApproval = getPreApproval()
    const sub = await preApproval.get({ id: dataId })

    const externalRef = sub.external_reference ?? ''
    const mpStatus = sub.status // authorized, paused, cancelled, pending

    const statusMap: Record<string, string> = {
      authorized: 'active',
      paused: 'paused',
      cancelled: 'canceled',
      pending: 'trialing',
    }
    const dbStatus = statusMap[mpStatus ?? ''] ?? 'trialing'

    // Parse external_reference: "org:<orgId>:plan:<planId>" or "new:plan:<planId>"
    const parts = externalRef.split(':')
    const isNew = parts[0] === 'new'
    const planId = parts[parts.length - 1]

    if (isNew) {
      // New subscription — org created on registration; link by mp_subscription_id once org registers
      // Store pending subscription for pickup after registration
      await admin.from('subscriptions').upsert({
        organization_id: '00000000-0000-0000-0000-000000000000', // placeholder, linked on registration
        plan_id: planId,
        status: dbStatus as 'active',
        mp_subscription_id: dataId,
        mp_payer_id: String(sub.payer_id ?? ''),
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'mp_subscription_id' })
    } else {
      const orgId = parts[1]
      const { data: existing } = await admin
        .from('subscriptions')
        .select('id')
        .eq('organization_id', orgId)
        .single()

      if (existing) {
        await admin.from('subscriptions').update({
          status: dbStatus as 'active',
          mp_subscription_id: dataId,
          mp_payer_id: String(sub.payer_id ?? ''),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', existing.id)
      } else {
        await admin.from('subscriptions').insert({
          organization_id: orgId,
          plan_id: planId,
          status: dbStatus as 'active',
          mp_subscription_id: dataId,
          mp_payer_id: String(sub.payer_id ?? ''),
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
        })
      }

      // Activate/deactivate org
      await admin.from('organizations').update({
        is_active: dbStatus === 'active',
        updated_at: new Date().toISOString(),
      }).eq('id', orgId)
    }
  }

  return NextResponse.json({ ok: true })
}
