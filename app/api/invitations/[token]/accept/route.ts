import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface Invitation {
  id: string
  token: string
  email: string
  role: string
  org_id: string
  expires_at: string
  accepted_at: string | null
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const admin = createAdminClient()

  const { data: inv } = await admin.from('invitations' as any)
    .select('*')
    .eq('token', token)
    .single() as { data: Invitation | null }

  if (!inv) return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
  if (inv.accepted_at) return NextResponse.json({ error: 'Invitación ya usada' }, { status: 400 })
  if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ error: 'Invitación expirada' }, { status: 400 })
  if (inv.email.toLowerCase() !== user.email?.toLowerCase()) {
    return NextResponse.json({ error: 'Email no coincide' }, { status: 403 })
  }

  const { error: memberError } = await admin.from('organization_members').upsert({
    organization_id: inv.org_id,
    user_id: user.id,
    role: inv.role as 'admin' | 'owner' | 'cashier',
    is_active: true,
    invited_by: null,
    joined_at: new Date().toISOString(),
  }, { onConflict: 'organization_id,user_id' })

  if (memberError) return NextResponse.json({ error: 'Error al agregar miembro' }, { status: 500 })

  await admin.from('invitations' as any).update({ accepted_at: new Date().toISOString() }).eq('token', token)

  return NextResponse.json({ ok: true })
}
