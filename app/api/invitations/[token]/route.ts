import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Invitation {
  token: string
  email: string
  role: string
  expires_at: string
  accepted_at: string | null
  organizations: { name: string; slug: string } | null
  profiles: { full_name: string | null } | null
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: inv } = await admin.from('invitations' as any)
    .select('token, email, role, expires_at, accepted_at, organizations(name, slug), profiles:invited_by(full_name)')
    .eq('token', token)
    .single() as { data: Invitation | null }

  if (!inv) return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })

  const org = inv.organizations
  const profile = inv.profiles

  return NextResponse.json({
    token: inv.token,
    email: inv.email,
    role: inv.role,
    org_name: org?.name ?? '',
    org_slug: org?.slug ?? '',
    inviter_name: profile?.full_name ?? 'Un miembro del equipo',
    expired: new Date(inv.expires_at) < new Date(),
    accepted: !!inv.accepted_at,
  })
}
