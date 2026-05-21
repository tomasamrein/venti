'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { ArrowLeft, Building2, Users, CreditCard, Settings, Printer, FileText, X } from 'lucide-react'
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
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  trialing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  past_due: 'bg-red-500/10 text-red-400 border-red-500/20',
  canceled: 'bg-zinc-700/30 text-zinc-500 border-zinc-700/30',
  paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
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

  // Factura C modal
  const [showFacturaModal, setShowFacturaModal] = useState(false)
  const [facturaAmount, setFacturaAmount] = useState('')
  const [facturaDesc, setFacturaDesc] = useState('')
  const [facturaCustomerName, setFacturaCustomerName] = useState('')
  const [facturaCustomerCuit, setFacturaCustomerCuit] = useState('')
  const [facturaLoading, setFacturaLoading] = useState(false)
  const [facturaResult, setFacturaResult] = useState<{ cae: string; invoice_number: number; cae_vto: string } | null>(null)

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

    const res = await fetch('/api/admin/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriptionId: sub.id,
        planId: editPlanId,
        status: editStatus,
        currentPeriodEnd: editPeriodEnd || undefined,
        orgId: (editStatus === 'active' || editStatus === 'trialing') ? id : undefined,
      }),
    })
    if (!res.ok) { toast.error('Error al guardar suscripción'); setSaving(false); return }

    if (editStatus === 'active' || editStatus === 'trialing') {
      setOrg(prev => prev ? { ...prev, is_active: true } : prev)
    }

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
    const res = await fetch('/api/admin/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: sub.id, status: 'canceled' }),
    })
    if (!res.ok) { toast.error('Error al cancelar'); setSaving(false); return }
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

  async function emitFacturaC() {
    const amount = parseFloat(facturaAmount)
    if (!amount || amount <= 0) { toast.error('Ingresá un importe válido'); return }
    setFacturaLoading(true)
    try {
      const res = await fetch('/api/admin/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_org_id: id,
          amount,
          description: facturaDesc || 'Suscripción Ventix',
          customer_name: facturaCustomerName || org?.name || undefined,
          customer_cuit: facturaCustomerCuit || org?.cuit || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al emitir'); return }
      setFacturaResult(data.result)
      toast.success(`Factura C emitida — CAE ${data.result.cae}`)
    } catch {
      toast.error('Error de red')
    } finally {
      setFacturaLoading(false)
    }
  }

  if (!org) return (
    <div className="flex items-center justify-center h-64">
      <div className="h-5 w-5 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
    </div>
  )

  const copyServiceEnabled = !!(org.settings as any)?.copy_service_enabled

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/admin/organizaciones" className="h-8 w-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors shrink-0 mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-zinc-100 truncate">{org.name}</h1>
          <p className="text-[13px] text-zinc-500 font-mono">{org.slug}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setShowFacturaModal(true); setFacturaResult(null); setFacturaAmount(''); setFacturaDesc(''); setFacturaCustomerName(org?.name ?? ''); setFacturaCustomerCuit(org?.cuit ?? '') }}
          className="h-8 px-3 rounded-lg text-[12px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors border border-zinc-700 flex items-center gap-1.5"
        >
          <FileText className="h-3.5 w-3.5" />
          Factura C
        </button>
        <button
          onClick={extendTrial}
          disabled={saving}
          className="h-8 px-3 rounded-lg text-[12px] font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors border border-zinc-700 disabled:opacity-50"
        >
          Extender trial +14d
        </button>
        <button
          onClick={toggleActive}
          disabled={saving}
          className={`h-8 px-3 rounded-lg text-[12px] font-medium transition-colors border disabled:opacity-50 ${org.is_active ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'}`}
        >
          {org.is_active ? 'Desactivar' : 'Activar'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Info */}
        <div className="md:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-zinc-500" />
            <h2 className="text-[14px] font-semibold text-zinc-100">Información</h2>
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
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-[13px] text-zinc-200">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Suscripción editable */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-zinc-500" />
              <h2 className="text-[14px] font-semibold text-zinc-100">Suscripción</h2>
            </div>
            {sub && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLOR[sub.status] ?? 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
                {editStatus || sub.status}
              </span>
            )}
          </div>

          {sub ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Plan</label>
                <select
                  value={editPlanId}
                  onChange={e => setEditPlanId(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-700 bg-zinc-800 text-[13px] text-zinc-100"
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Estado</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-700 bg-zinc-800 text-[13px] text-zinc-100"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1">Vencimiento</label>
                <input
                  type="date"
                  value={editPeriodEnd}
                  onChange={e => setEditPeriodEnd(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-zinc-700 bg-zinc-800 text-[13px] text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveSubscription}
                  disabled={saving}
                  className="flex-1 h-8 rounded-lg text-[12px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  Guardar
                </button>
                <button
                  onClick={cancelSubscription}
                  disabled={saving || sub.status === 'canceled'}
                  className="h-8 px-3 rounded-lg text-[12px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-zinc-600">Sin suscripción</p>
          )}
        </div>
      </div>

      {/* Configuración del negocio */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-zinc-500" />
          <h2 className="text-[14px] font-semibold text-zinc-100">Configuración del negocio</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-2">Tipo de negocio</label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => updateBusinessType(type)}
                  className={`h-8 px-3 rounded-lg text-[12px] font-medium capitalize transition-colors border ${
                    org.business_type === type
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'border-zinc-700 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-2">Módulos especiales</label>
            <button
              onClick={toggleCopyService}
              className={`flex items-center gap-3 h-10 px-4 rounded-xl border transition-colors w-full ${
                copyServiceEnabled
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : 'border-zinc-700 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <Printer className="h-4 w-4 shrink-0" />
              <span className="text-[13px] font-medium">Panel Fotocopiadora</span>
              <span className={`ml-auto text-[11px] font-bold ${copyServiceEnabled ? 'text-emerald-400' : 'text-zinc-600'}`}>
                {copyServiceEnabled ? 'ACTIVO' : 'INACTIVO'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Miembros */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
          <Users className="h-4 w-4 text-zinc-500" />
          <h2 className="text-[14px] font-semibold text-zinc-100">Equipo ({members.length})</h2>
        </div>
        <table className="w-full min-w-[360px]">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id} className="border-b border-zinc-800 last:border-0">
                <td className="px-5 py-3 text-[13px] text-zinc-200">{m.profiles?.full_name ?? 'Sin nombre'}</td>
                <td className="px-5 py-3 text-[13px] text-zinc-500 capitalize">{m.role}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${m.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-zinc-700/30 text-zinc-500 border-zinc-700/30'}`}>
                    {m.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
            {!members.length && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-[13px] text-zinc-600">Sin miembros</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Factura C */}
      {showFacturaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-500" />
                <h2 className="text-[15px] font-semibold text-zinc-100">Emitir Factura C</h2>
              </div>
              <button onClick={() => setShowFacturaModal(false)} className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-[12px] text-zinc-500">
              Org: <span className="font-medium text-zinc-200">{org.name}</span>
            </p>

            {facturaResult ? (
              <div className="space-y-3">
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-2">
                  <p className="text-[12px] font-semibold text-emerald-400">Factura emitida</p>
                  <div className="space-y-1">
                    <p className="text-[12px] text-zinc-500">Nro: <span className="font-mono text-zinc-200">{facturaResult.invoice_number}</span></p>
                    <p className="text-[12px] text-zinc-500">CAE: <span className="font-mono text-zinc-200">{facturaResult.cae}</span></p>
                    <p className="text-[12px] text-zinc-500">Vence: <span className="text-zinc-200">{facturaResult.cae_vto}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFacturaModal(false)}
                  className="w-full h-9 rounded-lg text-[13px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1.5">Razón social</label>
                    <input
                      type="text"
                      placeholder={org?.name ?? 'Nombre'}
                      value={facturaCustomerName}
                      onChange={e => setFacturaCustomerName(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1.5">CUIT</label>
                    <input
                      type="text"
                      placeholder={org?.cuit ?? '—'}
                      value={facturaCustomerCuit}
                      onChange={e => setFacturaCustomerCuit(e.target.value)}
                      className="w-full h-9 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1.5">Importe total (ARS)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={facturaAmount}
                    onChange={e => setFacturaAmount(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-[14px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1.5">Descripción</label>
                  <input
                    type="text"
                    placeholder="Suscripción Ventix"
                    value={facturaDesc}
                    onChange={e => setFacturaDesc(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-zinc-700 bg-zinc-800 text-[13px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <button
                  onClick={emitFacturaC}
                  disabled={facturaLoading || !facturaAmount}
                  className="w-full h-9 rounded-lg text-[13px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {facturaLoading && <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {facturaLoading ? 'Emitiendo...' : 'Emitir Factura C'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
