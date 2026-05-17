'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Building2, User, FileText, CreditCard, Users, GitBranch, ChevronRight, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOrg } from '@/hooks/use-org'
import { hasMultiBranch } from '@/lib/utils/plan'

interface OrgForm {
  name: string; cuit: string; address: string; phone: string; email: string
}

interface ProfileForm {
  full_name: string; phone: string
}


export default function ConfiguracionPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const { planType } = useOrg()

  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [fetching, setFetching] = useState(true)
  const [loadingOrg, setLoadingOrg] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [exportingData, setExportingData] = useState(false)
  const [orgForm, setOrgForm] = useState<OrgForm>({ name: '', cuit: '', address: '', phone: '', email: '' })
  const [profileForm, setProfileForm] = useState<ProfileForm>({ full_name: '', phone: '' })

  function setOrg<K extends keyof OrgForm>(k: K, v: string) { setOrgForm(f => ({ ...f, [k]: v })) }
  function setProf<K extends keyof ProfileForm>(k: K, v: string) { setProfileForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: org } = await supabase.from('organizations').select('*').eq('slug', orgSlug).single()
      if (!org) return
      setOrgId(org.id)
      setOrgForm({
        name: org.name ?? '', cuit: org.cuit ?? '',
        address: org.address ?? '', phone: org.phone ?? '', email: org.email ?? '',
      })

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setProfileForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' })
      }
      setFetching(false)
    }
    load()
  }, [orgSlug])

  async function exportBusinessData() {
    setExportingData(true)
    try {
      const res = await fetch(`/api/exports/business?org=${orgSlug}`)
      if (!res.ok) { toast.error('Error al exportar los datos'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] ?? 'ventix-export.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al exportar los datos')
    } finally {
      setExportingData(false)
    }
  }

  async function saveOrg(e: React.FormEvent) {
    e.preventDefault()
    if (!orgForm.name.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoadingOrg(true)
    const supabase = createClient()
    const { error } = await supabase.from('organizations').update({
      name: orgForm.name.trim(),
      cuit: orgForm.cuit || null,
      address: orgForm.address || null,
      phone: orgForm.phone || null,
      email: orgForm.email || null,
      updated_at: new Date().toISOString(),
    }).eq('id', orgId)

    if (error) toast.error('Error al guardar')
    else toast.success('Configuración guardada')
    setLoadingOrg(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profileForm.full_name.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoadingProfile(true)
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({
      full_name: profileForm.full_name.trim(),
      phone: profileForm.phone || null,
      updated_at: new Date().toISOString(),
    }).eq('id', userId)

    if (error) toast.error('Error al guardar')
    else toast.success('Perfil actualizado')
    setLoadingProfile(false)
  }

  if (fetching) {
    return (
      <div className="max-w-xl space-y-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border border-border bg-card h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  const showMultiBranch = hasMultiBranch(planType)
  const allSubPages = [
    { label: 'Suscripción', description: 'Plan actual y facturación', href: `/${orgSlug}/configuracion/suscripcion`, icon: CreditCard, color: 'text-emerald-600 bg-emerald-50', show: true },
    { label: 'Equipo', description: 'Usuarios y roles', href: `/${orgSlug}/configuracion/equipo`, icon: Users, color: 'text-violet-600 bg-violet-50', show: true },
    { label: 'Sucursales', description: 'Gestión de locales', href: `/${orgSlug}/configuracion/sucursales`, icon: GitBranch, color: 'text-amber-600 bg-amber-50', show: showMultiBranch },
    { label: 'Facturación ARCA', description: 'Certificado, CUIT, punto de venta', href: `/${orgSlug}/configuracion/facturacion`, icon: FileText, color: 'text-blue-600 bg-blue-50', show: true },
  ]
  const subPages = allSubPages.filter(p => p.show)

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Configuración</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Ajustá los datos de tu negocio y perfil</p>
      </div>

      {/* Sub-pages */}
      <div className="grid grid-cols-2 gap-3">
        {subPages.map(p => {
          const Icon = p.icon
          return (
            <button key={p.href} onClick={() => router.push(p.href)}
              className="rounded-xl border border-border bg-card p-4 text-left hover:border-slate-300 hover:bg-muted/30 transition-colors flex items-start gap-3 group">
              <div className={`w-9 h-9 rounded-lg ${p.color} flex items-center justify-center shrink-0`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{p.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{p.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground mt-0.5 shrink-0" />
            </button>
          )
        })}
      </div>

      <form onSubmit={saveOrg} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-600" />
          <h2 className="text-[14px] font-semibold">Datos del negocio</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Nombre del negocio *</Label>
            <Input value={orgForm.name} onChange={e => setOrg('name', e.target.value)}
              className="h-10 bg-muted/30 border-border rounded-xl text-[14px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">CUIT</Label>
              <Input value={orgForm.cuit} onChange={e => setOrg('cuit', e.target.value)}
                placeholder="30-12345678-9"
                className="h-10 bg-muted/30 border-border rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Teléfono</Label>
              <Input value={orgForm.phone} onChange={e => setOrg('phone', e.target.value)}
                className="h-10 bg-muted/30 border-border rounded-xl text-[14px]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Email</Label>
            <Input value={orgForm.email} onChange={e => setOrg('email', e.target.value)}
              type="email" className="h-10 bg-muted/30 border-border rounded-xl text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Dirección</Label>
            <Input value={orgForm.address} onChange={e => setOrg('address', e.target.value)}
              className="h-10 bg-muted/30 border-border rounded-xl text-[14px]" />
          </div>

        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/30">
          <Button type="submit" disabled={loadingOrg} className="rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}>
            {loadingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </form>

      {/* Export data */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <Download className="h-4 w-4 text-emerald-600" />
          <h2 className="text-[14px] font-semibold">Exportar mis datos</h2>
        </div>
        <div className="p-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[13px] text-foreground">Descargá todos tus datos en un archivo Excel.</p>
            <p className="text-[12px] text-muted-foreground mt-1">Incluye productos, clientes, proveedores y ventas de los últimos 12 meses.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 rounded-xl text-[13px] gap-2"
            onClick={exportBusinessData}
            disabled={exportingData}
          >
            {exportingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exportingData ? 'Exportando...' : 'Descargar'}
          </Button>
        </div>
      </div>

      <form onSubmit={saveProfile} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-600" />
          <h2 className="text-[14px] font-semibold">Tu perfil</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Nombre completo *</Label>
            <Input value={profileForm.full_name} onChange={e => setProf('full_name', e.target.value)}
              className="h-10 bg-muted/30 border-border rounded-xl text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Teléfono</Label>
            <Input value={profileForm.phone} onChange={e => setProf('phone', e.target.value)}
              className="h-10 bg-muted/30 border-border rounded-xl text-[14px]" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end bg-muted/30">
          <Button type="submit" disabled={loadingProfile} className="rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}>
            {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar perfil
          </Button>
        </div>
      </form>
    </div>
  )
}
