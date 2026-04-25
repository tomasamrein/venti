import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatARS } from '@/lib/utils/currency'
import { Wallet, TrendingUp, TrendingDown, Clock } from 'lucide-react'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ from?: string; to?: string }>
}

interface Session {
  id: string
  opened_at: string
  closed_at: string | null
  opening_amount: number
  closing_amount: number | null
  expected_amount: number | null
  difference: number | null
  status: string
  branches: { name: string } | null
  opened_by_profile: { full_name: string | null } | null
}

export default async function ReportesCajaPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { from, to } = await searchParams
  const supabase = await createClient()

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  const now = new Date()
  const defaultFrom = new Date(now); defaultFrom.setDate(now.getDate() - 29)
  const fromDate = from ? new Date(from) : defaultFrom
  const toDate = to ? new Date(to + 'T23:59:59') : now

  const { data: sessions } = await supabase
    .from('cash_sessions')
    .select('id, opened_at, closed_at, opening_amount, closing_amount, expected_amount, difference, status, branches(name), opened_by:profiles!opened_by(full_name)')
    .eq('organization_id', org.id)
    .gte('opened_at', fromDate.toISOString())
    .lte('opened_at', toDate.toISOString())
    .order('opened_at', { ascending: false })

  const allSessions = (sessions ?? []) as unknown as Session[]

  const closedSessions = allSessions.filter(s => s.status === 'closed')
  const totalExpected = closedSessions.reduce((s, c) => s + (c.expected_amount ?? 0), 0)
  const totalClosing = closedSessions.reduce((s, c) => s + (c.closing_amount ?? 0), 0)
  const totalDiff = closedSessions.reduce((s, c) => s + (c.difference ?? 0), 0)
  const avgSession = closedSessions.length ? totalClosing / closedSessions.length : 0

  function duration(s: Session) {
    if (!s.closed_at) return 'Abierta'
    const ms = new Date(s.closed_at).getTime() - new Date(s.opened_at).getTime()
    const h = Math.floor(ms / 3600000)
    const m = Math.floor((ms % 3600000) / 60000)
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Reporte de caja</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {fromDate.toLocaleDateString('es-AR')} — {toDate.toLocaleDateString('es-AR')}
          </p>
        </div>
        <form className="flex gap-2" method="GET">
          <input type="date" name="from" defaultValue={from ?? fromDate.toISOString().slice(0, 10)}
            className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-foreground" />
          <input type="date" name="to" defaultValue={to ?? now.toISOString().slice(0, 10)}
            className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-foreground" />
          <button type="submit" className="h-9 px-4 rounded-xl text-[13px] font-medium text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            Filtrar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sesiones', value: String(closedSessions.length), icon: Wallet, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Total cierre', value: formatARS(totalClosing), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Diferencia total', value: formatARS(Math.abs(totalDiff)), icon: TrendingDown, color: totalDiff >= 0 ? 'text-emerald-400' : 'text-red-400', bg: totalDiff >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
          { label: 'Promedio/sesión', value: formatARS(avgSession), icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-card card-shadow p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
              <p className="text-[20px] font-extrabold tracking-tight">{s.value}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-[14px] font-semibold">Sesiones de caja</h2>
        </div>
        {!allSessions.length
          ? <p className="text-center py-10 text-[14px] text-muted-foreground">Sin sesiones en el período</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['Apertura', 'Sucursal', 'Cajero', 'Apertura $', 'Cierre $', 'Esperado', 'Diferencia', 'Duración'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {allSessions.map(s => {
                    const diff = s.difference ?? 0
                    return (
                      <tr key={s.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(s.opened_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3">{s.branches?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{s.opened_by_profile?.full_name ?? '—'}</td>
                        <td className="px-4 py-3">{formatARS(s.opening_amount)}</td>
                        <td className="px-4 py-3 font-medium">
                          {s.closing_amount != null ? formatARS(s.closing_amount) : <span className="text-amber-400">Abierta</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {s.expected_amount != null ? formatARS(s.expected_amount) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          {s.difference != null
                            ? <span className={diff >= 0 ? 'text-emerald-400' : 'text-red-400'}>{diff >= 0 ? '+' : ''}{formatARS(diff)}</span>
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{duration(s)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </div>
    </div>
  )
}
