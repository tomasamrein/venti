import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { org_id, email, role } = await request.json() as { org_id: string; email: string; role: string }
  if (!org_id || !email || !role) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })

  const { data: member } = await supabase.from('organization_members')
    .select('role').eq('organization_id', org_id).eq('user_id', user.id).eq('is_active', true).single()
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { data: org } = await supabase.from('organizations').select('name, slug').eq('id', org_id).single()
  if (!org) return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })

  const { data: inviterProfile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()

  const admin = createAdminClient()

  const { data: existing } = await admin.from('invitations' as never)
    .select('id').eq('org_id', org_id).eq('email', email.toLowerCase())
    .gt('expires_at', new Date().toISOString()).is('accepted_at', null)
    .single() as { data: { id: string } | null }

  let token: string

  if (existing) {
    token = existing.id
  } else {
    const { data: inv, error } = await admin.from('invitations' as never).insert({
      email: email.toLowerCase(),
      org_id,
      role,
      invited_by: user.id,
    }).select('token').single() as { data: { token: string } | null; error: unknown }

    if (error || !inv) return NextResponse.json({ error: 'Error al crear invitación' }, { status: 500 })
    token = inv.token
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const inviteUrl = `${appUrl}/invite/${token}`
  const inviterName = inviterProfile?.full_name ?? 'Un miembro del equipo'
  const roleLabel = role === 'admin' ? 'Admin' : 'Cajero'

  // Send email via Resend if configured
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Ventix <noreply@ventix.ar>',
        to: email,
        subject: `${inviterName} te invitó a ${org.name} en Ventix`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#16a34a;margin-bottom:8px">Fuiste invitado a ${org.name}</h2>
            <p style="color:#374151;margin-bottom:16px">
              <strong>${inviterName}</strong> te invitó a unirte como <strong>${roleLabel}</strong> en Ventix.
            </p>
            <a href="${inviteUrl}"
              style="display:inline-block;background:#16a34a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Aceptar invitación
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">
              El link expira en 7 días. Si no esperabas esta invitación, podés ignorar este email.
            </p>
          </div>
        `,
      }),
    })
  }

  return NextResponse.json({ ok: true, invite_url: inviteUrl })
}
