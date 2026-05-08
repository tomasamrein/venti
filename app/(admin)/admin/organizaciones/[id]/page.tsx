'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Building2, Users, CreditCard, Settings, Printer } from 'lucide-react'
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
  business_type: string | null
  settings: Record<string, any>
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
  plan_id: string
  current_period_end: string | null
  subscription_plans: { name: string; price_ars: number } | null
}

interface Plan {
  id: string
  name: string
  type: string
  price_ars: number
}

const STATUS_OPTIONS = ['active', 'trialing', 'past_due', 'canceled', 'paused']
const BUSINESS_TYPES = ['kiosco', 'almacen', 'drugstore', 'fotocopiadora', 'otro']

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  trialing: 'bg-blue-100 text-blue-700',
  past_due: 'bg-red-100 text-red-700',
  canceled: 'bg-[#3d4560]/40 text-muted-foreground',
  paused: 'bg-amber-100 text-amber-700',
}

export default function AdminOrgDetailPage() {
  const { id } = useParams<{ id: string }>()
  const supabase = createClient()

  const [org, setOrg] = useState<Org | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [sub, setSub] = useState<Sub | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [saving, setSaving] = useState(false)

  // Editable subscription fields
  const [editPlanId, setEditPlanId] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editPeriodEnd, setEditPeriodEnd] = useState('')

  useEffect(() => {
    async function load() {
      const [{ data: orgData }, { data: membersData }, { data: subData }, { data: plansData }] = await Promise.all([
        supabase.from('organizations').select('id,name,slug,cuit,address,phone,email,is_active,trial_ends_at,business_type,settings,created_at').eq('id', id).single(),
        supabase.from('organization_members').select('id, role, is_active, profiles(id, full_name)').eq('organization_id', id),
        supabase.from('subscriptions').select('id, status, plan_id, current_period_end, subscription_plans(name, price_ars)').eq('organization_id', id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('subscription_plans').select('id, name, type, price_ars').eq('is_active', true).order('price_ars'),
      ])
      if (orgData) setOrg(orgData as unknown as Org)
      if (membersData) setMembers(membersData as unknown as Member[])
      if (subData) {
        setSub(subData as unknown as Sub)
        setEditPlanId((subData as any).plan_id ?? '')
        setEditStatus((subData as any).status ?? '')
        setEditPeriodEnd((subData as any).current_period_end ? (subData as any).current_period_end.slice(0, 10) : '')
      }
      if (plansData) setPlans(plansData as Plan[])
    }
    load()
  }, [id])

  async function toggleActive() {
    if (!org) return
    setSaving(true)
    const { error } = await supabase.from('organizations').update({ is_active: !org.is_active }).eq('id', id)
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
    const { error } = await supabase.from('organizations').update({ trial_ends_at: newDate.toISOString() }).eq('id', id)
    if (error) { toast.error('Error al extender trial'); setSaving(false); return }
    setOrg(prev => prev ? { ...prev, trial_ends_at: newDate.toISOString() } : prev)
    toast.success('Trial extendido 14 días')
    setSaving(false)
  }

  async function saveSubscription() {
    if (!sub) return
    setSaving(true)
    // If reactivating from canceled/past_due, also activate the org
    if ((sub.status === 'canceled' || sub.status === 'past_due') && editStatus === 'active') {
      await supabase.from('organizations').update({ is_active: true }).eq('id', id)
      setOrg(prev => prev ? { ...prev, is_active: true } : prev)
    }

    type SubStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused'
    const subUpdate: { plan_id: string; status: SubStatus; updated_at: string; current_period_end?: string } = {
      plan_id: editPlanId,
      status: editStatus as SubStatus,
      updated_at: new Date().toISOString(),
    }
    if (editPeriodEnd) subUpdate.current_period_end = new Date(editPeriodEnd).toISOString()

    const { error } = await supabase.from('subscriptions').update(subUpdate).eq('id', sub.id)
    if (error) { toast.error('Error al guardar suscripción'); setSaving(false); return }

    const selectedPlan = plans.find(p => p.id === editPlanId)
    setSub(prev => prev ? {
      ...prev,
      plan_id: editPlanId,
      status: editStatus,
      current_period_end: editPeriodEnd ? new Date(editPeriodEnd).toISOString() : prev.current_period_end,
      subscription_plans: selectedPlan ? { name: selectedPlan.name, price_ars: selectedPlan.price_ars } : prev.subscription_plans,
    } : prev)
    toast.success('Suscripción actualizada')
    setSaving(false)
  }

  async function cancelSubscription() {
    if (!sub) return
    setSaving(true)
    const now = new Date().toISOString()
    const { error } = await supabase.from('subscriptions').update({ status: 'canceled', canceled_at: now, updated_at: now }).eq('id', sub.id)
    if (error) { toast.error('Error al cancelar'); setSaving(false); return }
    setSub(prev => prev ? { ...prev, status: 'canceled' } : prev)
    setEditStatus('canceled')
    toast.success('Suscripción cancelada')
    setSaving(false)
  }

  async function updateBusinessType(value: string) {
    if (!org) return
    const { error } = await supabase.from('organizations').update({ business_type: value as 'kiosco' | 'almacen' | 'drugstore' | 'fotocopiadora' | 'otro' }).eq('id', id)
    if (error) { toast.error('Error al actualizar tipo de negocio'); return }
    setOrg(prev => prev ? { ...prev, business_type: value } : prev)
    toast.success('Tipo de negocio actualizado')
  }

  async function toggleCopyService() {
    if (!org) return
    const current = !!(org.settings as any)?.copy_service_enabled
    const newSettings = { ...(org.settings ?? {}), copy_service_enabled: !current }
    const { error } = await supabase.from('organizations').update({ settings: newSettings }).eq('id', id)
    if (error) { toast.error('Error al actualizar'); return }
    setOrg(prev => prev ? { ...prev, settings: newSettings } : prev)
    toast.success(!current ? 'Panel de fotocopiadora activado' : 'Panel de fotocopiadora desactivado')
  }

  if (!org) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-5 w-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
    </div>
  )

  const copyServiceEnabled = !!(org.settings as any)?.copy_service_enabled

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/organizaciones" className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">{org.name}</h1>
          <p className="text-[13px] text-muted-foreground font-mono">{org.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={extendTrial}
            disabled={saving}
            className="h-8 px-3 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors border border-border disabled:opacity-50"
          >
            Extender trial +14d
          </button>
          <button
            onClick={toggleActive}
            disabled={saving}
            className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50 ${org.is_active ? 'bg-red-100 text-red-700 hover:bg-red-500/25' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-500/25'}`}
          >
            {org.is_active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-[14px] font-semibold text-foreground">Información</h2>
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
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-[13px] text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suscripción editable */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-[14px] font-semibold text-foreground">Suscripción</h2>
            </div>
            {sub && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLOR[sub.status] ?? 'bg-slate-100 text-slate-700'}`}>
                {editStatus || sub.status}
              </span>
            )}
          </div>

          {sub ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">Plan</label>
                <select
                  value={editPlanId}
                  onChange={e => setEditPlanId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[13px] text-foreground"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">Estado</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[13px] text-foreground"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-1">Vencimiento</label>
                <input
                  type="date"
                  value={editPeriodEnd}
                  onChange={e => setEditPeriodEnd(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[13px] text-foreground"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveSubscription}
                  disabled={saving}
                  className="flex-1 h-8 rounded-lg text-[12px] font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={cancelSubscription}
                  disabled={saving || sub.status === 'canceled'}
                  className="h-8 px-3 rounded-lg text-[12px] font-medium bg-red-100 text-red-700 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">Sin suscripción</p>
          )}
        </div>
      </div>

      {/* Configuración del negocio */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[14px] font-semibold text-foreground">Configuración del negocio</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">Tipo de negocio</label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => updateBusinessType(type)}
                  className={`h-8 px-3 rounded-lg text-[12px] font-medium capitalize transition-colors border ${
                    org.business_type === type
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground uppercase tracking-wider block mb-2">Módulos especiales</label>
            <button
              onClick={toggleCopyService}
              className={`flex items-center gap-3 h-10 px-4 rounded-xl border transition-colors ${
                copyServiceEnabled
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400'
                  : 'border-border text-muted-foreground hover:bg-muted/40'
              }`}
            >
              <Printer className="h-4 w-4" />
              <span className="text-[13px] font-medium">Panel Fotocopiadora</span>
              <span className={`ml-auto text-[11px] font-semibold ${copyServiceEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                {copyServiceEnabled ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Miembros */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[14px] font-semibold text-foreground">Equipo ({members.length})</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Nombre</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-border">
                <td className="px-5 py-3 text-[13px] text-foreground">{m.profiles?.full_name ?? 'Sin nombre'}</td>
                <td className="px-5 py-3 text-[13px] text-muted-foreground capitalize">{m.role}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${m.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-[#3d4560]/40 text-muted-foreground'}`}>
                    {m.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            {!members.length && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-[13px] text-muted-foreground">Sin miembros</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
