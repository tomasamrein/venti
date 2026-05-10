import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles').select('is_super_admin').eq('id', user.id).single()
  if (!profile?.is_super_admin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { title, body, targetOrgIds } = await request.json() as {
    title: string
    body: string
    targetOrgIds?: string[]
  }

  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'Título y mensaje son requeridos' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Get all active org IDs if no specific target
  let orgIds: string[] = targetOrgIds ?? []
  if (!orgIds.length) {
    const { data: orgs } = await admin
      .from('organizations')
      .select('id')
      .eq('is_active', true)
    orgIds = (orgs ?? []).map(o => o.id)
  }

  if (!orgIds.length) return NextResponse.json({ sent: 0 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = orgIds.map(orgId => ({
    organization_id: orgId,
    user_id: null,
    type: 'announcement',
    title: title.trim(),
    body: body.trim(),
    data: { from: 'super_admin', sent_by: user.id },
  }))

  const { error } = await admin.from('notifications').insert(rows)
  if (error) {
    console.error('[send-announcement]', error)
    return NextResponse.json({ error: 'Error al enviar' }, { status: 500 })
  }

  return NextResponse.json({ sent: rows.length })
}
