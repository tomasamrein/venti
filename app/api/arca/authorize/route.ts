import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getArcaToken, extractPemsFromP12 } from '@/lib/arca/auth'
import type { ArcaSettings } from '@/types/arca'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { org_id } = body as { org_id: string }
    if (!org_id) return NextResponse.json({ error: 'org_id requerido' }, { status: 400 })

    // Verify membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', org_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!member || !['owner', 'admin'].includes(member.role)) {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: org } = await admin
      .from('organizations')
      .select('settings')
      .eq('id', org_id)
      .single()

    const arcaSettings = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
    if (!arcaSettings?.cert_pem || !arcaSettings?.key_pem) {
      return NextResponse.json({ error: 'Credenciales ARCA no configuradas' }, { status: 422 })
    }

    const { token, updatedSettings } = await getArcaToken(arcaSettings)

    // Persist updated token cache
    await admin
      .from('organizations')
      .update({ settings: { ...(org!.settings as object), arca: updatedSettings } as any })
      .eq('id', org_id)

    return NextResponse.json({
      ok: true,
      expires_at: token.expires_at,
      cuit: arcaSettings.cuit,
      environment: arcaSettings.environment,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/** Parse a .p12 file and return PEM strings — helper for the config UI */
export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const form = await req.formData()
    const file = form.get('file') as File | null
    const password = (form.get('password') as string) ?? ''

    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')

    const { certPem, keyPem } = extractPemsFromP12(base64, password)

    return NextResponse.json({ certPem, keyPem })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al procesar el certificado'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
