'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getArcaToken } from '@/lib/arca/auth'
import type { ArcaSettings } from '@/types/arca'

// ─── Helpers ────────────────────────────────────────────────────────────────

async function assertOwner(orgId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!member || member.role !== 'owner') throw new Error('Solo el owner puede configurar la facturación')
  return user
}

// ─── Read ARCA settings (never returns cert_pem / key_pem to the client) ────

export async function getArcaConfig(orgId: string): Promise<{
  cuit?: string
  punto_venta?: number
  environment?: 'homologation' | 'production'
  hasCert: boolean
  certSubject?: string
}> {
  await assertOwner(orgId)

  const supabase = await createClient()
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const arca = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined

  // Derive cert subject from PEM without sending the key to the client
  let certSubject: string | undefined
  if (arca?.cert_pem) {
    const match = arca.cert_pem.match(/Subject:\s*(.+)/i)
    certSubject = match?.[1]?.trim()
  }

  return {
    cuit: arca?.cuit,
    punto_venta: arca?.punto_venta,
    environment: arca?.environment,
    hasCert: !!arca?.cert_pem,
    certSubject,
  }
}

// ─── Save ARCA settings ──────────────────────────────────────────────────────

export async function saveArcaConfig(
  orgId: string,
  payload: {
    cuit: string
    punto_venta: number
    environment: 'homologation' | 'production'
    cert_pem?: string
    key_pem?: string
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await assertOwner(orgId)

    if (!payload.cuit || !payload.punto_venta) {
      return { ok: false, error: 'CUIT y punto de venta son obligatorios' }
    }

    const admin = createAdminClient()

    const { data: org } = await admin
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single()

    const currentSettings = (org?.settings ?? {}) as Record<string, unknown>
    const existing = currentSettings.arca as ArcaSettings | undefined

    const newArcaSettings: Partial<ArcaSettings> = {
      cuit: payload.cuit,
      punto_venta: payload.punto_venta,
      environment: payload.environment,
      // Only overwrite cert/key if new values were provided
      cert_pem: payload.cert_pem || existing?.cert_pem,
      key_pem: payload.key_pem || existing?.key_pem,
    }

    // Invalidate token cache if credentials changed
    const certsChanged = payload.cert_pem && payload.cert_pem !== existing?.cert_pem
    if (!certsChanged && existing?.token_cache) {
      newArcaSettings.token_cache = existing.token_cache
    }

    const { error } = await admin
      .from('organizations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ settings: { ...currentSettings, arca: newArcaSettings } as any })
      .eq('id', orgId)

    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Error al guardar' }
  }
}

// ─── Test ARCA connection ────────────────────────────────────────────────────

export async function testArcaConnection(
  orgId: string
): Promise<{ ok: boolean; message: string; expires_at?: string }> {
  try {
    await assertOwner(orgId)

    const admin = createAdminClient()
    const { data: org } = await admin
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .single()

    const arcaSettings = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
    if (!arcaSettings?.cert_pem || !arcaSettings?.key_pem) {
      return { ok: false, message: 'Credenciales ARCA no configuradas. Guardá el certificado primero.' }
    }

    const { token, updatedSettings } = await getArcaToken(arcaSettings)

    // Persist updated token cache
    await admin
      .from('organizations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ settings: { ...(org!.settings as object), arca: updatedSettings } as any })
      .eq('id', orgId)

    return {
      ok: true,
      message: `Conexión exitosa. Token válido hasta ${new Date(token.expires_at).toLocaleTimeString('es-AR')}`,
      expires_at: token.expires_at,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de red'
    return { ok: false, message: msg }
  }
}
