import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatARS } from '@/lib/utils/currency'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ status?: string; method?: string; from?: string; to?: string }>
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completada', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  on_hold: { label: 'En espera', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  canceled: { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  refunded: { label: 'Reembolsada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', debit: 'Débito', credit: 'Crédito',
  transfer: 'Transferencia', mercadopago: 'MercadoPago',
  current_account: 'Cta. corriente', mixed: 'Mixto',
}

export default async function VentasPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { status, method, from, to } = await searchParams
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fromDate = from ?? today.toISOString().split('T')[0]
  const toDate = to ?? new Date().toISOString().split('T')[0]

  let query = supabase
    .from('sales')
    .select('*, customers(full_name)')
    .eq('organization_id', org.id)
    .gte('created_at', `${fromDate}T00:00:00`)
    .lte('created_at', `${toDate}T23:59:59`)
    .order('created_at', { ascending: false })
    .limit(200)

  if (status) query = query.eq('status', status as 'completed' | 'on_hold' | 'canceled' | 'refunded')
  if (method) query = query.eq('payment_method', method as 'cash' | 'debit' | 'credit' | 'transfer' | 'mercadopago' | 'current_account' | 'mixed')

  const { data: sales } = await query

  const totalRevenue = sales?.filter(s => s.status === 'completed').reduce((s, v) => s + v.total, 0) ?? 0

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Ventas</h1>
          <p className="text-[14px] text-muted-foreground mt-1">{sales?.length ?? 0} registros · {formatARS(totalRevenue)} facturado</p>
        </div>
        <Link
          href={`/${orgSlug}/pos`}
          className="inline-flex items-center gap-2 rounded-xl text-white text-[13px] font-semibold h-9 px-4 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}
        >
          <ShoppingCart className="h-4 w-4" />
          Nueva venta
        </Link>
      </div>

      <form method="GET" className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Desde</label>
          <input type="date" name="from" defaultValue={fromDate}
            className="h-9 px-3 rounded-xl bg-card border border-white/[0.08] text-[13px] text-foreground focus:outline-none focus:border-violet-500/50" />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hasta</label>
          <input type="date" name="to" defaultValue={toDate}
            className="h-9 px-3 rounded-xl bg-card border border-white/[0.08] text-[13px] text-foreground focus:outline-none focus:border-violet-500/50" />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</label>
          <select name="status" defaultValue={status ?? ''}
            className="h-9 px-3 rounded-xl bg-card border border-white/[0.08] text-[13px] text-foreground focus:outline-none focus:border-violet-500/50">
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Método</label>
          <select name="method" defaultValue={method ?? ''}
            className="h-9 px-3 rounded-xl bg-card border border-white/[0.08] text-[13px] text-foreground focus:outline-none focus:border-violet-500/50">
            <option value="">Todos</option>
            {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <Button type="submit" variant="secondary" size="sm" className="h-9 rounded-xl text-[13px]">Filtrar</Button>
      </form>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">#</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Fecha</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Cliente</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Método</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Estado</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Total</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!sales?.length && (
              <tr>
                <td colSpan={7} className="text-center py-14 text-[14px] text-muted-foreground">
                  No hay ventas para los filtros seleccionados
                </td>
              </tr>
            )}
            {sales?.map(s => {
              const statusInfo = STATUS_LABELS[s.status] ?? { label: s.status, color: 'text-muted-foreground' }
              const customer = Array.isArray(s.customers) ? s.customers[0] : s.customers as { full_name: string } | null
              return (
                <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="text-[13px] text-muted-foreground font-mono">
                      {s.sale_number ? `#${s.sale_number}` : s.id.slice(0, 6)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-[13px]">{new Date(s.created_at).toLocaleDateString('es-AR')}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(s.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-[13px] text-muted-foreground">
                    {customer?.full_name || 'Sin cliente'}
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-[13px] text-muted-foreground">
                    {METHOD_LABELS[s.payment_method] ?? s.payment_method}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <Badge variant="outline" className={`text-[11px] border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-[14px] font-bold">{formatARS(s.total)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/${orgSlug}/ventas/${s.id}`} className="h-7 px-3 text-[12px] rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 inline-flex items-center transition-colors">
                      Ver
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
