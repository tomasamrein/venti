import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ status?: string }>
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  trialing: 'Trial',
  past_due: 'Vencida',
  canceled: 'Cancelada',
  paused: 'Pausada',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400',
  trialing: 'bg-blue-500/15 text-blue-400',
  past_due: 'bg-red-500/15 text-red-400',
  canceled: 'bg-[#3d4560]/40 text-[#5a6480]',
  paused: 'bg-amber-500/15 text-amber-400',
}

export default async function AdminSubscriptionsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('subscriptions')
    .select('id, status, current_period_start, current_period_end, canceled_at, created_at, organizations(id, name, slug), subscription_plans(name, price_ars, type)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status as 'active' | 'trialing' | 'past_due' | 'canceled' | 'paused')

  const { data: subs } = await query

  const counts: Record<string, number> = {}
  const { data: all } = await supabase.from('subscriptions').select('status')
  all?.forEach(s => { counts[s.status] = (counts[s.status] ?? 0) + 1 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-white">Suscripciones</h1>
        <p className="text-[13px] text-[#5a6480] mt-0.5">{subs?.length ?? 0} resultados</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link
          href="/admin/suscripciones"
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${!status ? 'bg-white/10 text-white' : 'text-[#5a6480] hover:text-white hover:bg-white/5'}`}
        >
          Todas ({all?.length ?? 0})
        </Link>
        {Object.entries(STATUS_LABEL).map(([key, label]) => (
          <Link
            key={key}
            href={`/admin/suscripciones?status=${key}`}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${status === key ? 'bg-white/10 text-white' : 'text-[#5a6480] hover:text-white hover:bg-white/5'}`}
          >
            {label} ({counts[key] ?? 0})
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Organización</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Plan</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Período</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Precio</th>
            </tr>
          </thead>
          <tbody>
            {subs?.map(sub => {
              const org = sub.organizations as { id: string; name: string; slug: string } | null
              const plan = sub.subscription_plans as { name: string; price_ars: number; type: string } | null
              return (
                <tr key={sub.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    {org ? (
                      <Link href={`/admin/organizaciones/${org.id}`} className="text-[13px] font-medium text-white hover:text-blue-400 transition-colors">
                        {org.name}
                      </Link>
                    ) : <span className="text-[13px] text-[#5a6480]">—</span>}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-[#8891a8]">{plan?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLOR[sub.status] ?? 'bg-white/10 text-white'}`}>
                      {STATUS_LABEL[sub.status] ?? sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-[#5a6480]">
                    {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('es-AR') : '—'}
                  </td>
                  <td className="px-5 py-3 text-[13px] text-white">
                    {plan ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(plan.price_ars) : '—'}
                  </td>
                </tr>
              )
            })}
            {!subs?.length && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#5a6480]">Sin suscripciones</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
