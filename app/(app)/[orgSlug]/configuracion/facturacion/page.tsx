'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Save, TestTube2, Upload, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import type { ArcaSettings } from '@/types/arca'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default function ConfiguracionFacturacionPage({ params }: Props) {
  const [orgId, setOrgId] = useState('')
  const [settings, setSettings] = useState<Partial<ArcaSettings>>({
    environment: 'homologation',
    punto_venta: 1,
  })
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [p12Loading, setP12Loading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [p12Password, setP12Password] = useState('')

  useEffect(() => {
    params.then(async p => {
      const supabase = createClient()
      const { data: org } = await supabase
        .from('organizations')
        .select('id, settings')
        .eq('slug', p.orgSlug)
        .single()
      if (!org) return
      setOrgId(org.id)
      const arca = (org.settings as Record<string, unknown>)?.arca as ArcaSettings | undefined
      if (arca) {
        setSettings({
          cuit: arca.cuit,
          punto_venta: arca.punto_venta,
          environment: arca.environment,
          cert_pem: arca.cert_pem,
          key_pem: arca.key_pem,
        })
      }
    })
  }, [params])

  async function handleP12Upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setP12Loading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('password', p12Password)
      const res = await fetch('/api/arca/authorize', { method: 'PUT', body: form })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error al procesar el certificado'); return }
      setSettings(s => ({ ...s, cert_pem: json.certPem, key_pem: json.keyPem }))
      toast.success('Certificado cargado correctamente')
    } catch {
      toast.error('Error al procesar el archivo')
    } finally {
      setP12Loading(false)
      e.target.value = ''
    }
  }

  async function handleSave() {
    if (!orgId) return
    if (!settings.cuit || !settings.punto_venta) {
      toast.error('Completá CUIT y punto de venta')
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: org } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .single()

      const currentSettings = (org?.settings ?? {}) as Record<string, unknown>
      const newArcaSettings: Partial<ArcaSettings> = {
        cuit: settings.cuit,
        punto_venta: settings.punto_venta,
        environment: settings.environment ?? 'homologation',
        ...(settings.cert_pem && { cert_pem: settings.cert_pem }),
        ...(settings.key_pem && { key_pem: settings.key_pem }),
      }

      // Preserve existing token cache if creds didn't change
      const existing = currentSettings.arca as ArcaSettings | undefined
      if (existing?.token_cache && settings.cert_pem === existing.cert_pem) {
        newArcaSettings.token_cache = existing.token_cache
      }

      await supabase
        .from('organizations')
        .update({ settings: { ...currentSettings, arca: newArcaSettings } as any })
        .eq('id', orgId)

      toast.success('Configuración guardada')
      setTestResult(null)
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!orgId) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/arca/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId }),
      })
      const json = await res.json()
      if (res.ok) {
        setTestResult({ ok: true, message: `Conexión exitosa. Token válido hasta ${new Date(json.expires_at).toLocaleTimeString('es-AR')}` })
      } else {
        setTestResult({ ok: false, message: json.error ?? 'Error de conexión' })
      }
    } catch {
      setTestResult({ ok: false, message: 'Error de red' })
    } finally {
      setTesting(false)
    }
  }

  const hasCert = !!settings.cert_pem

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Facturación ARCA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurá tus credenciales fiscales para emitir facturas A, B y C.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Datos fiscales</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <Label htmlFor="cuit" className="mb-1.5 block">CUIT del emisor</Label>
            <Input
              id="cuit"
              placeholder="20-12345678-9"
              value={settings.cuit ?? ''}
              onChange={e => setSettings(s => ({ ...s, cuit: e.target.value }))}
              className="rounded-xl font-mono"
            />
          </div>
          <div>
            <Label htmlFor="pto_venta" className="mb-1.5 block">Punto de venta</Label>
            <Input
              id="pto_venta"
              type="number"
              min={1}
              max={9999}
              placeholder="1"
              value={settings.punto_venta ?? ''}
              onChange={e => setSettings(s => ({ ...s, punto_venta: parseInt(e.target.value) || 1 }))}
              className="rounded-xl"
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block">Ambiente</Label>
          <Select
            value={settings.environment ?? 'homologation'}
            onValueChange={v => setSettings(s => ({ ...s, environment: v as ArcaSettings['environment'] }))}
          >
            <SelectTrigger className="rounded-xl w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="homologation">Homologación (testing)</SelectItem>
              <SelectItem value="production">Producción</SelectItem>
            </SelectContent>
          </Select>
          {settings.environment === 'production' && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              ⚠️ En producción las facturas son fiscalmente válidas.
            </p>
          )}
        </div>
      </div>

      {/* Certificate */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Certificado digital</h2>
          {hasCert && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Certificado cargado
            </span>
          )}
        </div>

        <div>
          <Label className="mb-1.5 block">Subir archivo .p12</Label>
          <div className="flex gap-3">
            <Input
              type="password"
              placeholder="Contraseña del .p12 (si tiene)"
              value={p12Password}
              onChange={e => setP12Password(e.target.value)}
              className="rounded-xl flex-1"
            />
            <input ref={fileRef} type="file" accept=".p12,.pfx" className="hidden" onChange={handleP12Upload} />
            <Button
              variant="outline"
              className="rounded-xl gap-2 shrink-0"
              onClick={() => fileRef.current?.click()}
              disabled={p12Loading}
            >
              {p12Loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {p12Loading ? 'Procesando...' : 'Subir .p12'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            O pegá el PEM del certificado y clave privada manualmente:
          </p>
        </div>

        <div>
          <Label htmlFor="cert_pem" className="mb-1.5 block">Certificado (PEM)</Label>
          <textarea
            id="cert_pem"
            rows={4}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            value={settings.cert_pem ?? ''}
            onChange={e => setSettings(s => ({ ...s, cert_pem: e.target.value }))}
            className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="key_pem">Clave privada (PEM)</Label>
            <button
              type="button"
              onClick={() => setShowKey(v => !v)}
              className="text-xs text-muted-foreground flex items-center gap-1"
            >
              {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {showKey ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <textarea
            id="key_pem"
            rows={4}
            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
            value={showKey ? (settings.key_pem ?? '') : (settings.key_pem ? '••••••••••••••••••••' : '')}
            readOnly={!showKey}
            onChange={e => showKey && setSettings(s => ({ ...s, key_pem: e.target.value }))}
            className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Test result */}
      {testResult && (
        <div className={`flex items-start gap-2.5 p-4 rounded-xl border text-sm ${
          testResult.ok
            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
            : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        }`}>
          {testResult.ok
            ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          }
          {testResult.message}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={handleTest}
          disabled={testing || !orgId}
        >
          {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />}
          {testing ? 'Probando...' : 'Probar conexión'}
        </Button>
        <Button
          className="gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}
