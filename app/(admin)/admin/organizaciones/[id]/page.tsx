'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Org {
  id: string
  name: string
  slug: string
  cuit: string | null
  address: string | null
  phone: string | null
  email: string | null
  is_active: boolean
  trial_ends_at: string | null
  created_at: string
}

interface Member {
  id: string
  role: string
  is_active: boolean
  profiles: { full_name: string | null; id: string } | null
}

interface Sub {
  id: string
  status: string
  current_period_end: string | null
  subscription_plans: { name: string; price_ars: number } | null
}

export default function AdminOrgDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [org, setOrg] = useState<Org | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [sub, setSub] = useState<Sub | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: orgData }, { data: membersData }, { data: subData }] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', id).single(),
        supabase.from('organization_members').select('id, role, is_active, profiles(id, full_name)').eq('organization_id', id),
        supabase.from('subscriptions').select('id, status, current_period_end, subscription_plans(name, price_ars)').eq('organization_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])
      if (orgData) setOrg(orgData as Org)
      if (membersData) setMembers(membersData as unknown as Member[])
      if (subData) setSub(subData as unknown as Sub)
    }
    load()
  }, [id])

  async function toggleActive() {
    if (!org) return
    setSaving(true)
    const { error } = await supabase
      .from('organizations')
      .update({ is_active: !org.is_active })
      .eq('id', id)
    if (error) { toast.error('Error al actualizar'); setSaving(false); return }
    setOrg(prev => prev ? { ...prev, is_active: !prev.is_active } : prev)
    toast.success(org.is_active ? 'Organización desactivada' : 'Organización activada')
    setSaving(false)
  }

  async function extendTrial() {
    if (!org) return
    setSaving(true)
    const newDate = new Date()
    newDate.setDate(newDate.getDate() + 14)
    const { error } = await supabase
      .from('organizations')
      .update({ trial_ends_at: newDate.toISOString() })
      .eq('id', id)
    if (error) { toast.error('Error al extender trial'); setSaving(false); return }
    setOrg(prev => prev ? { ...prev, trial_ends_at: newDate.toISOString() } : prev)
    toast.success('Trial extendido 14 días')
    setSaving(false)
  }

  if (!org) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-5 w-5 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  )

  const STATUS_COLOR: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400',
    trialing: 'bg-blue-500/15 text-blue-400',
    past_due: 'bg-red-500/15 text-red-400',
    canceled: 'bg-[#3d4560]/40 text-[#5a6480]',
    paused: 'bg-amber-500/15 text-amber-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organizaciones" className="h-8 w-8 rounded-lg flex items-center justify-center text-[#5a6480] hover:text-white hover:bg-white/5 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold tracking-tight text-white">{org.name}</h1>
          <p className="text-[13px] text-[#5a6480] font-mono">{org.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={extendTrial}
            disabled={saving}
            className="h-8 px-3 rounded-lg text-[12px] font-medium text-[#8891a8] hover:text-white hover:bg-white/5 transition-colors border border-white/[0.08] disabled:opacity-50"
          >
            Extender trial +14d
          </button>
          <button
            onClick={toggleActive}
            disabled={saving}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 ${org.is_active ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25' : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25'}`}
          >
            {org.is_active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info */}
        <div className="md:col-span-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#5a6480]" />
            <h2 className="text-[14px] font-semibold text-white">Información</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Email', org.email ?? '—'],
              ['Teléfono', org.phone ?? '—'],
              ['CUIT', org.cuit ?? '—'],
              ['Dirección', org.address ?? '—'],
              ['Creada', new Date(org.created_at).toLocaleDateString('es-AR')],
              ['Trial hasta', org.trial_ends_at ? new Date(org.trial_ends_at).toLocaleDateString('es-AR') : '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] text-[#5a6480] uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-[13px] text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suscripción */}
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-[#5a6480]" />
            <h2 className="text-[14px] font-semibold text-white">Suscripción</h2>
          </div>
          {sub ? (
            <div className="space-y-3">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium ${STATUS_COLOR[sub.status] ?? 'bg-white/10 text-white'}`}>
                {sub.status}
              </span>
              <div>
                <p className="text-[11px] text-[#5a6480] uppercase tracking-wider mb-0.5">Plan</p>
                <p className="text-[13px] text-white">{sub.subscription_plans?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#5a6480] uppercase tracking-wider mb-0.5">Precio</p>
                <p className="text-[13px] text-white">
                  {sub.subscription_plans ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(sub.subscription_plans.price_ars) + '/mes' : '—'}
                </p>
              </div>
              {sub.current_period_end && (
                <div>
                  <p className="text-[11px] text-[#5a6480] uppercase tracking-wider mb-0.5">Vence</p>
                  <p className="text-[13px] text-white">{new Date(sub.current_period_end).toLocaleDateString('es-AR')}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[13px] text-[#5a6480]">Sin suscripción</p>
          )}
        </div>
      </div>

      {/* Miembros */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
          <Users className="h-4 w-4 text-[#5a6480]" />
          <h2 className="text-[14px] font-semibold text-white">Equipo ({members.length})</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Nombre</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-white/[0.03]">
                <td className="px-5 py-3 text-[13px] text-white">{m.profiles?.full_name ?? 'Sin nombre'}</td>
                <td className="px-5 py-3 text-[13px] text-[#8891a8] capitalize">{m.role}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${m.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#3d4560]/40 text-[#5a6480]'}`}>
                    {m.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            {!members.length && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-[13px] text-[#5a6480]">Sin miembros</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
