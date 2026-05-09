import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:admin@venti.ar',
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )
  // Internal endpoint — validate with dedicated internal secret
  const authHeader = req.headers.get('authorization')
  const internalSecret = process.env.INTERNAL_PUSH_SECRET
  if (!internalSecret) {
    console.error('[push/send] INTERNAL_PUSH_SECRET no configurado')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { organizationId, title, body, data } = await req.json() as {
    organizationId: string
    title: string
    body?: string
    data?: Record<string, unknown>
  }

  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('organization_id', organizationId)

  if (!subs?.length) return NextResponse.json({ sent: 0 })

  const payload = JSON.stringify({ title, body, data })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
        payload,
      )
    )
  )

  const sent = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ sent, total: subs.length })
}
