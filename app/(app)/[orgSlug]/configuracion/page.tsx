'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Building2, User, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface OrgForm {
  name: string; cuit: string; address: string; phone: string; email: string
}

interface ProfileForm {
  full_name: string; phone: string
}

const TIMEZONES = [
  'America/Argentina/Buenos_Aires',
  'America/Argentina/Cordoba',
  'America/Argentina/Mendoza',
]

export default function ConfiguracionPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [fetching, setFetching] = useState(true)
  const [loadingOrg, setLoadingOrg] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [orgForm, setOrgForm] = useState<OrgForm>({ name: '', cuit: '', address: '', phone: '', email: '' })
  const [profileForm, setProfileForm] = useState<ProfileForm>({ full_name: '', phone: '' })
  const [timezone, setTimezone] = useState('America/Argentina/Buenos_Aires')

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
      setTimezone(org.timezone ?? 'America/Argentina/Buenos_Aires')

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        setProfileForm({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' })
      }
      setFetching(false)
    }
    load()
  }, [orgSlug])

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
      timezone,
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
          <div key={i} className="rounded-xl border border-white/[0.07] bg-card h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Configuración</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Ajustá los datos de tu negocio y perfil</p>
      </div>

      <form onSubmit={saveOrg} className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <Building2 className="h-4 w-4 text-violet-400" />
          <h2 className="text-[14px] font-semibold">Datos del negocio</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Nombre del negocio *</Label>
            <Input value={orgForm.name} onChange={e => setOrg('name', e.target.value)}
              className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">CUIT</Label>
              <Input value={orgForm.cuit} onChange={e => setOrg('cuit', e.target.value)}
                placeholder="30-12345678-9"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Teléfono</Label>
              <Input value={orgForm.phone} onChange={e => setOrg('phone', e.target.value)}
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Email</Label>
            <Input value={orgForm.email} onChange={e => setOrg('email', e.target.value)}
              type="email" className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Dirección</Label>
            <Input value={orgForm.address} onChange={e => setOrg('address', e.target.value)}
              className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
              <Globe className="h-3 w-3" />Zona horaria
            </Label>
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-foreground focus:outline-none focus:border-violet-500/50">
              {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz.replace('America/Argentina/', '')}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/[0.05] flex justify-end bg-white/[0.01]">
          <Button type="submit" disabled={loadingOrg} className="rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            {loadingOrg && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </form>

      <form onSubmit={saveProfile} className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <User className="h-4 w-4 text-indigo-400" />
          <h2 className="text-[14px] font-semibold">Tu perfil</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Nombre completo *</Label>
            <Input value={profileForm.full_name} onChange={e => setProf('full_name', e.target.value)}
              className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Teléfono</Label>
            <Input value={profileForm.phone} onChange={e => setProf('phone', e.target.value)}
              className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/[0.05] flex justify-end bg-white/[0.01]">
          <Button type="submit" disabled={loadingProfile} className="rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            {loadingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Actualizar perfil
          </Button>
        </div>
      </form>
    </div>
  )
}
