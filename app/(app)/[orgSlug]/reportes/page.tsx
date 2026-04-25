'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import { TrendingUp, ShoppingCart, Package, AlertTriangle, DollarSign } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface DayStat {
  date: string
  label: string
  total: number
  count: number
}

interface TopProduct {
  name: string
  quantity: number
  revenue: number
}

interface StockAlert {
  id: string
  product_id: string
  alert_type: string
  current_stock: number
  threshold: number | null
  products: { name: string } | null
}

type Period = '7d' | '30d' | 'month'

export default function ReportesPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [period, setPeriod] = useState<Period>('7d')
  const [dayStats, setDayStats] = useState<DayStat[]>([])
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [fetching, setFetching] = useState(true)
  const [orgId, setOrgId] = useState('')

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
      if (!org) return
      setOrgId(org.id)
      await loadData(org.id, period)
    }
    init()
  }, [orgSlug])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (orgId) loadData(orgId, period)
  }, [period, orgId])  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData(oId: string, p: Period) {
    setFetching(true)
    const supabase = createClient()
    const now = new Date()
    let fromDate: Date

    if (p === '7d') {
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 6); fromDate.setHours(0, 0, 0, 0)
    } else if (p === '30d') {
      fromDate = new Date(now); fromDate.setDate(now.getDate() - 29); fromDate.setHours(0, 0, 0, 0)
    } else {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const { data: sales } = await supabase
      .from('sales')
      .select('total, created_at, status')
      .eq('organization_id', oId)
      .eq('status', 'completed')
      .gte('created_at', fromDate.toISOString())
      .order('created_at')

    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('name, quantity, subtotal, sale_id')
      .eq('organization_id', oId)

    const { data: alerts } = await supabase
      .from('stock_alerts')
      .select('*, products(name)')
      .eq('organization_id', oId)
      .eq('is_resolved', false)
      .limit(10)

    const byDay: Record<string, DayStat> = {}
    const dayCount = p === '7d' ? 7 : p === '30d' ? 30 : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    for (let i = dayCount - 1; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0, 0, 0, 0)
      const key = d.toISOString().split('T')[0]
      byDay[key] = {
        date: key,
        label: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        total: 0, count: 0,
      }
    }

    for (const s of sales ?? []) {
      const key = s.created_at.split('T')[0]
      if (byDay[key]) { byDay[key].total += s.total; byDay[key].count += 1 }
    }

    const productMap: Record<string, TopProduct> = {}
    for (const item of saleItems ?? []) {
      if (!productMap[item.name]) productMap[item.name] = { name: item.name, quantity: 0, revenue: 0 }
      productMap[item.name].quantity += item.quantity
      productMap[item.name].revenue += item.subtotal
    }
    const top = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    setDayStats(Object.values(byDay))
    setTopProducts(top)
    setStockAlerts((alerts ?? []) as StockAlert[])
    setFetching(false)
  }

  const totalRevenue = dayStats.reduce((s, d) => s + d.total, 0)
  const totalSales = dayStats.reduce((s, d) => s + d.count, 0)
  const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0

  const PERIOD_LABELS: Record<Period, string> = { '7d': 'Últimos 7 días', '30d': 'Últimos 30 días', 'month': 'Este mes' }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Reportes</h1>
          <p className="text-[14px] text-muted-foreground mt-1">{PERIOD_LABELS[period]}</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', 'month'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`h-8 px-3 rounded-lg text-[13px] font-medium transition-colors ${period === p ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-muted-foreground hover:text-white hover:bg-white/5'}`}>
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: 'Facturado', value: formatARS(totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { title: 'Ventas', value: totalSales.toString(), icon: ShoppingCart, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { title: 'Ticket promedio', value: formatARS(avgTicket), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.title} className="rounded-xl border border-white/[0.07] bg-card card-shadow p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.title}</p>
              </div>
              <p className="text-[24px] font-extrabold tracking-[-0.03em]">{fetching ? '...' : stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow p-5">
        <h2 className="text-[14px] font-semibold mb-5">Ventas diarias</h2>
        {fetching ? (
          <div className="h-52 rounded-xl bg-white/[0.03] animate-pulse" />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={dayStats}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.64 0.26 278)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.64 0.26 278)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 5%)" />
              <XAxis dataKey="label" tick={{ fill: 'oklch(0.65 0.02 264)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'oklch(0.65 0.02 264)', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#0f1320', border: '1px solid oklch(1 0 0 / 8%)', borderRadius: '12px', fontSize: '12px' }}
                formatter={(value) => [formatARS(Number(value)), 'Facturado']}
              />
              <Area type="monotone" dataKey="total" stroke="oklch(0.64 0.26 278)" strokeWidth={2} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-[14px] font-semibold">Top productos</h2>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {fetching
              ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex justify-between">
                  <div className="h-4 w-32 rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-4 w-20 rounded bg-white/[0.05] animate-pulse" />
                </div>
              ))
              : !topProducts.length
              ? <p className="text-center py-8 text-[14px] text-muted-foreground">Sin datos</p>
              : topProducts.map((p, i) => (
                <div key={p.name} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-muted-foreground w-5">{i + 1}</span>
                    <div>
                      <p className="text-[13px] font-medium">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.quantity} unidades</p>
                    </div>
                  </div>
                  <p className="text-[13px] font-bold">{formatARS(p.revenue)}</p>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h2 className="text-[14px] font-semibold">Alertas de stock</h2>
            {stockAlerts.length > 0 && (
              <span className="ml-auto h-5 min-w-5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-bold flex items-center justify-center px-1.5">
                {stockAlerts.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-white/[0.04]">
            {fetching
              ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3 flex justify-between">
                  <div className="h-4 w-32 rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-4 w-16 rounded bg-white/[0.05] animate-pulse" />
                </div>
              ))
              : !stockAlerts.length
              ? <p className="text-center py-8 text-[14px] text-muted-foreground">Sin alertas activas</p>
              : stockAlerts.map(a => {
                const isOut = a.alert_type === 'out_of_stock'
                return (
                  <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                    <p className="text-[13px] font-medium">{a.products?.name ?? 'Producto eliminado'}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${isOut ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                      {isOut ? 'Sin stock' : `Stock: ${a.current_stock}`}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
