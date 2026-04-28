import { NextRequest, NextResponse } from 'next/server'
import { verifyMpSignature, processMpWebhook } from '@/lib/mercadopago/webhooks'

export async function POST(req: NextRequest) {
  const body = await req.text()

  let payload: { type?: string; action?: string; data?: { id?: string | number } }
  try {
    payload = JSON.parse(body)
  } catch {
    // MP sometimes sends a 200 ping at config time — accept it
    return NextResponse.json({ ok: true })
  }

  // MP uses both `type` and `action` in different APIs. Normalize.
  const type = payload.type ?? payload.action?.split('.')[0] ?? ''
  const dataId = payload.data?.id?.toString() ?? req.nextUrl.searchParams.get('data.id') ?? ''

  if (!type || !dataId) {
    return NextResponse.json({ ok: true, skipped: 'missing_type_or_id' })
  }

  // Verify signature only when secret is configured (allows local testing)
  if (process.env.MP_WEBHOOK_SECRET) {
    const xSignature = req.headers.get('x-signature') ?? ''
    const xRequestId = req.headers.get('x-request-id') ?? ''
    if (!verifyMpSignature({ xSignature, xRequestId, dataId })) {
      console.warn('[MP Webhook] Invalid signature for data.id=', dataId)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  try {
    const result = await processMpWebhook(type, dataId)
    // Always 200 to prevent MP from retrying indefinitely on logic errors.
    // Real failures (network/DB) throw and return 500 below so MP DOES retry.
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    console.error('[MP Webhook] Processing error:', err)
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }
}

// MP sends GET to verify endpoint reachability
export async function GET() {
  return NextResponse.json({ ok: true })
}
