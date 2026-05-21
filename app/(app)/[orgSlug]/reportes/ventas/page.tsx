import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatARS } from '@/lib/utils/currency'
import { ShoppingCart, TrendingUp, DollarSign, Users, PackageMinus, TrendingDown } from 'lucide-react'
import { CsvExportButton } from '@/components/shared/csv-export-button'
import { isBusinessTier } from '@/lib/utils/plan'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ from?: string; to?: string; method?: string }>
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', debit: 'Débito', credit: 'Crédito',
  transfer: 'Transferencia', mercadopago: 'MercadoPago',
  current_account: 'Cta. corriente', mixed: 'Mixto',
}

export default async function ReportesVentasPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { from, to, method } = await searchParams
  const supabase = await createClient()

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan:subscription_plans(type)')
    .eq('organization_id', org.id)
    .maybeSingle()
  const planType = (subscription?.plan as { type?: string } | null)?.type ?? 'free_trial'
  const showMargin = isBusinessTier(planType)

  // Parse dates in Argentina timezone (-03:00) so a `from=2026-05-01` selected by the user
  // means "00:00 of 2026-05-01 in Buenos Aires", not 00:00 UTC.
  const AR_OFFSET = '-03:00'
  const now = new Date()
  const defaultFrom = new Date(now); defaultFrom.setDate(now.getDate() - 29); defaultFrom.setHours(0, 0, 0, 0)
  const fromDate = from ? new Date(`${from}T00:00:00${AR_OFFSET}`) : defaultFrom
  const toDate = to ? new Date(`${to}T23:59:59${AR_OFFSET}`) : now

  let query = supabase
    .from('sales')
    .select('id, total, subtotal, tax_amount, discount_amount, payment_method, created_at, customers(full_name)')
    .eq('organization_id', org.id)
    .eq('status', 'completed')
    .gte('created_at', fromDate.toISOString())
    .lte('created_at', toDate.toISOString())
    .order('created_at', { ascending: false })

  if (method) query = query.eq('payment_method', method as 'cash')

  const { data: sales } = await query

  // Stock orders cost (Pro only)
  let totalStockCost = 0
  if (showMargin) {
    const { data: stockOrders } = await (supabase as any)
      .from('stock_orders')
      .select('total_cost')
      .eq('organization_id', org.id)
      .eq('status', 'received')
      .gte('received_at', fromDate.toISOString())
      .lte('received_at', toDate.toISOString())
    totalStockCost = ((stockOrders ?? []) as { total_cost: number }[]).reduce((s, o) => s + o.total_cost, 0)
  }

  const totalRevenue = (sales ?? []).reduce((s, v) => s + v.total, 0)
  const totalTax = (sales ?? []).reduce((s, v) => s + (v.tax_amount ?? 0), 0)
  const totalDiscount = (sales ?? []).reduce((s, v) => s + (v.discount_amount ?? 0), 0)
  const avgTicket = sales?.length ? totalRevenue / sales.length : 0

  // By method breakdown
  const byMethod: Record<string, { count: number; total: number }> = {}
  for (const s of sales ?? []) {
    const m = s.payment_method
    if (!byMethod[m]) byMethod[m] = { count: 0, total: 0 }
    byMethod[m].count++
    byMethod[m].total += s.total
  }

  const METHODS = ['cash', 'debit', 'credit', 'transfer', 'mercadopago', 'current_account', 'mixed']

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Reporte de ventas</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {fromDate.toLocaleDateString('es-AR')} — {toDate.toLocaleDateString('es-AR')}
          </p>
        </div>
        <form className="flex gap-2 flex-wrap" method="GET">
          <input type="date" name="from" defaultValue={from ?? fromDate.toISOString().slice(0,10)}
            className="h-9 px-3 rounded-xl bg-muted/30 border border-border text-[13px] text-foreground" />
          <input type="date" name="to" defaultValue={to ?? now.toISOString().slice(0,10)}
            className="h-9 px-3 rounded-xl bg-muted/30 border border-border text-[13px] text-foreground" />
          <select name="method" defaultValue={method ?? ''}
            className="h-9 px-3 rounded-xl bg-muted/30 border border-border text-[13px] text-foreground">
            <option value="">Todos los medios</option>
            {METHODS.map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
          <button type="submit" className="h-9 px-4 rounded-xl text-[13px] font-medium text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}>
            Filtrar
          </button>
          <CsvExportButton
            filename={`ventas-${fromDate.toISOString().slice(0,10)}.csv`}
            data={(sales ?? []).map(s => ({
              Fecha: new Date(s.created_at).toLocaleString('es-AR'),
              Cliente: (s.customers as { full_name: string } | null)?.full_name ?? '',
              Medio: METHOD_LABELS[s.payment_method] ?? s.payment_method,
              Total: s.total,
            }))}
          />
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Facturado', value: formatARS(totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Ventas', value: String(sales?.length ?? 0), icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-600/10' },
          { label: 'Ticket promedio', value: formatARS(avgTicket), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'IVA total', value: formatARS(totalTax), icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-border bg-card p-5">
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

      {/* Margin (Pro only) */}
      {showMargin && (
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: 'Costo de reposición',
              value: formatARS(totalStockCost),
              icon: PackageMinus,
              color: 'text-red-400',
              bg: 'bg-red-500/10',
              note: 'Órdenes de compra recibidas en el período',
            },
            {
              label: 'Margen neto estimado',
              value: formatARS(totalRevenue - totalStockCost),
              icon: TrendingDown,
              color: totalRevenue - totalStockCost >= 0 ? 'text-emerald-400' : 'text-red-400',
              bg: totalRevenue - totalStockCost >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
              note: 'Facturado − Costo de reposición',
            },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">PRO</span>
                </div>
                <p className="text-[20px] font-extrabold tracking-tight">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{s.note}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* By method */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[14px] font-semibold">Por medio de pago</h2>
        </div>
        <div className="divide-y divide-border">
          {METHODS.filter(m => byMethod[m]).map(m => {
            const pct = totalRevenue > 0 ? (byMethod[m].total / totalRevenue) * 100 : 0
            return (
              <div key={m} className="px-5 py-3 flex items-center gap-4">
                <p className="text-[13px] font-medium w-36">{METHOD_LABELS[m]}</p>
                <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-600/60" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[13px] text-muted-foreground w-10 text-right">{byMethod[m].count}</p>
                <p className="text-[13px] font-bold w-28 text-right">{formatARS(byMethod[m].total)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-[14px] font-semibold">Detalle de ventas</h2>
        </div>
        {!sales?.length
          ? <p className="text-center py-10 text-[14px] text-muted-foreground">Sin ventas en el período</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border">
                    {['Fecha', 'Cliente', 'Medio de pago', 'Total'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3">
                        {(s.customers as { full_name: string } | null)?.full_name ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{METHOD_LABELS[s.payment_method] ?? s.payment_method}</td>
                      <td className="px-5 py-3 font-bold">{formatARS(s.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {totalDiscount > 0 && (
        <p className="text-[12px] text-muted-foreground text-right">
          Descuentos totales aplicados: {formatARS(totalDiscount)}
        </p>
      )}
    </div>
  )
}
