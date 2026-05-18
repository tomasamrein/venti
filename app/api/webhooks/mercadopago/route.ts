import { NextResponse } from 'next/server'

// MP integration disabled — subscriptions are managed manually by superadmin.
// Keeping the endpoint alive so MP doesn't error if a webhook URL was configured.
export async function POST() {
  return NextResponse.json({ ok: true, skipped: 'mp_disabled' })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
