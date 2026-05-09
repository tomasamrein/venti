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

// ─── Read ARCA settings (never returns cert/key to the client) ───────────────

export async function getArcaConfig(orgId: string): Promise<{
  cuit?: string
  punto_venta?: number
  environment?: 'homologation' | 'production'
  hasCert: boolean
  certSubject?: string
}> {
  await assertOwner(orgId)

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organizations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const arca = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
  const hasCert = !!(arca?.vault_cert_id)

  // Derive cert subject from vault PEM without exposing it to the browser
  let certSubject: string | undefined
  if (hasCert) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creds } = await (admin.rpc as any)('get_arca_cert_key', { p_org_id: orgId })
    const certPem = Array.isArray(creds) ? creds[0]?.cert_pem : creds?.cert_pem
    if (certPem) {
      const match = certPem.match(/Subject:\s*(.+)/i)
      if (!match) {
        // Try CN= parsing for standard PEM headers
        const cnMatch = certPem.match(/CN=([^,\n]+)/i)
        certSubject = cnMatch?.[1]?.trim()
      } else {
        certSubject = match[1]?.trim()
      }
    }
  }

  return {
    cuit: arca?.cuit,
    punto_venta: arca?.punto_venta,
    environment: arca?.environment,
    hasCert,
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

    // Build new arca settings without cert/key (those live in vault)
    const newArcaSettings: ArcaSettings = {
      cuit: payload.cuit,
      punto_venta: payload.punto_venta,
      environment: payload.environment,
      vault_cert_id: existing?.vault_cert_id,
      vault_key_id: existing?.vault_key_id,
    }

    // Preserve token cache if creds didn't change
    if (existing?.token_cache) {
      newArcaSettings.token_cache = existing.token_cache
    }

    // If new cert/key provided, move them to vault
    if (payload.cert_pem && payload.key_pem) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: vaultIds, error: vaultErr } = await (admin.rpc as any)('set_arca_vault_creds', {
        p_org_id: orgId,
        p_cert_pem: payload.cert_pem,
        p_key_pem: payload.key_pem,
      })
      if (vaultErr) return { ok: false, error: vaultErr.message }

      const ids = Array.isArray(vaultIds) ? vaultIds[0] : vaultIds
      newArcaSettings.vault_cert_id = ids.vault_cert_id
      newArcaSettings.vault_key_id  = ids.vault_key_id
      // Invalidate token cache when creds change
      delete newArcaSettings.token_cache
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

    const arcaDb = (org?.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
    if (!arcaDb?.vault_cert_id) {
      return { ok: false, message: 'Credenciales ARCA no configuradas. Guardá el certificado primero.' }
    }

    // Fetch creds from vault (server-side only)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: creds, error: credsErr } = await (admin.rpc as any)('get_arca_cert_key', { p_org_id: orgId })
    if (credsErr) return { ok: false, message: credsErr.message }

    const { cert_pem, key_pem } = Array.isArray(creds) ? creds[0] : creds
    if (!cert_pem || !key_pem) {
      return { ok: false, message: 'No se pudieron leer las credenciales del vault.' }
    }

    const arcaSettings: ArcaSettings = { ...arcaDb, cert_pem, key_pem }
    const { token, updatedSettings } = await getArcaToken(arcaSettings)

    // Persist updated token cache — strip cert/key before saving to DB
    const { cert_pem: _c, key_pem: _k, ...cacheableSettings } = updatedSettings
    await admin
      .from('organizations')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ settings: { ...(org!.settings as object), arca: cacheableSettings } as any })
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
