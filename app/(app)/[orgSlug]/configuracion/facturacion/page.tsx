'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Save, TestTube2, Upload, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react'
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
import { useOrg } from '@/hooks/use-org'
import { hasInvoicing } from '@/lib/utils/plan'
import { getArcaConfig, saveArcaConfig, testArcaConnection } from './actions'

interface LocalSettings {
  cuit: string
  punto_venta: number
  environment: 'homologation' | 'production'
  // cert/key are write-only inputs — never stored in state after initial load
  cert_pem: string
  key_pem: string
}

export default function ConfiguracionFacturacionPage() {
  const { org, planType } = useOrg()
  const orgId = org.id

  if (!hasInvoicing(planType)) {
    return (
      <div className="max-w-xl flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
          <FileText className="h-7 w-7 text-blue-500" />
        </div>
        <h2 className="text-[20px] font-extrabold tracking-tight">Facturación ARCA</h2>
        <p className="text-[14px] text-muted-foreground max-w-sm">
          La facturación electrónica está disponible a partir del plan <span className="font-semibold text-foreground">Avanzado</span>. Contactanos para actualizar tu plan.
        </p>
        <a
          href="https://wa.me/543437479134?text=Hola!%20Quiero%20habilitar%20la%20facturaci%C3%B3n%20ARCA%20en%20Ventix"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[14px] font-semibold transition-colors"
        >
          Contactar por WhatsApp
        </a>
      </div>
    )
  }

  const [settings, setSettings] = useState<LocalSettings>({
    cuit: '',
    punto_venta: 1,
    environment: 'homologation',
    cert_pem: '',
    key_pem: '',
  })
  const [hasCert, setHasCert] = useState(false)
  const [certSubject, setCertSubject] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [p12Loading, setP12Loading] = useState(false)
  const [p12Password, setP12Password] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!orgId) return
    getArcaConfig(orgId).then(cfg => {
      setSettings(s => ({
        ...s,
        cuit: cfg.cuit ?? '',
        punto_venta: cfg.punto_venta ?? 1,
        environment: cfg.environment ?? 'homologation',
      }))
      setHasCert(cfg.hasCert)
      setCertSubject(cfg.certSubject)
    })
  }, [orgId])

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
      // Store PEM in local state only for submission — never shown back to user
      setSettings(s => ({ ...s, cert_pem: json.certPem, key_pem: json.keyPem }))
      setHasCert(true)
      toast.success('Certificado listo para guardar')
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
    const result = await saveArcaConfig(orgId, {
      cuit: settings.cuit,
      punto_venta: settings.punto_venta,
      environment: settings.environment,
      cert_pem: settings.cert_pem || undefined,
      key_pem: settings.key_pem || undefined,
    })
    setSaving(false)

    if (!result.ok) {
      toast.error(result.error)
      return
    }

    // Clear local cert/key from state after saving (never keep them in memory)
    setSettings(s => ({ ...s, cert_pem: '', key_pem: '' }))
    setTestResult(null)
    toast.success('Configuración guardada')

    // Refresh cert status
    getArcaConfig(orgId).then(cfg => {
      setHasCert(cfg.hasCert)
      setCertSubject(cfg.certSubject)
    })
  }

  async function handleTest() {
    if (!orgId) return
    setTesting(true)
    setTestResult(null)
    const result = await testArcaConnection(orgId)
    setTesting(false)
    setTestResult({ ok: result.ok, message: result.message })
  }

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
              value={settings.cuit}
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
              value={settings.punto_venta}
              onChange={e => setSettings(s => ({ ...s, punto_venta: parseInt(e.target.value) || 1 }))}
              className="rounded-xl"
            />
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block">Ambiente</Label>
          <Select
            value={settings.environment}
            onValueChange={v => setSettings(s => ({ ...s, environment: v as 'homologation' | 'production' }))}
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

      {/* Certificate — write-only, keys never travel back to client */}
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Certificado digital</h2>
          {hasCert && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {certSubject ? `Cargado: ${certSubject}` : 'Certificado cargado'}
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
            O pegá el PEM del certificado y clave privada manualmente (write-only — no se muestran una vez guardados):
          </p>
        </div>

        <div>
          <Label htmlFor="cert_pem" className="mb-1.5 block">
            Certificado (PEM) {hasCert && !settings.cert_pem && <span className="text-muted-foreground font-normal">— dejá vacío para mantener el actual</span>}
          </Label>
          <textarea
            id="cert_pem"
            rows={4}
            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
            value={settings.cert_pem}
            onChange={e => setSettings(s => ({ ...s, cert_pem: e.target.value }))}
            className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <Label htmlFor="key_pem">
              Clave privada (PEM) {hasCert && !settings.key_pem && <span className="text-muted-foreground font-normal">— dejá vacío para mantener la actual</span>}
            </Label>
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
            value={showKey ? settings.key_pem : (settings.key_pem ? '•'.repeat(40) : '')}
            readOnly={!showKey}
            onChange={e => showKey && setSettings(s => ({ ...s, key_pem: e.target.value }))}
            className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

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
          className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-600"
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
