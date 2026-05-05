import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, DollarSign, Package, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatARS } from '@/lib/utils/currency'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { TopProductsTable } from '@/components/dashboard/top-products-table'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { toZonedTime, format as tzFormat } from 'date-fns-tz'

interface Props {
  params: Promise<{ orgSlug: string }>
}

const TZ = 'America/Argentina/Buenos_Aires'

export default async function DashboardPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single()

  if (!org) return null

  // Start of today in Argentina timezone
  const nowUtc = new Date()
  const nowAR = toZonedTime(nowUtc, TZ)
  const startOfTodayAR = new Date(nowAR)
  startOfTodayAR.setHours(0, 0, 0, 0)
  // Convert back to UTC for the query
  const todayStart = new Date(startOfTodayAR.getTime() - startOfTodayAR.getTimezoneOffset() * 60000).toISOString()

  const [
    { data: todaySales },
    { count: totalProducts },
    { count: lowStockCount },
    { data: openSession },
    { data: saleItemsToday },
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('id, total, payment_method, completed_at, created_at, customer_id, sale_number, customers(full_name)')
      .eq('organization_id', org.id)
      .eq('status', 'completed')
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('is_active', true),
    supabase
      .from('stock_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('is_resolved', false),
    supabase
      .from('cash_sessions')
      .select('opening_amount')
      .eq('organization_id', org.id)
      .eq('status', 'open')
      .maybeSingle(),
    supabase
      .from('sale_items')
      .select('product_id, name, quantity, subtotal')
      .eq('organization_id', org.id)
      .gte('created_at', todayStart),
  ])

  const totalHoy = todaySales?.reduce((sum, s) => sum + s.total, 0) ?? 0
  const cantidadHoy = todaySales?.length ?? 0

  // Sales by hour for chart
  const hourMap: Record<string, number> = {}
  for (let h = 8; h <= 22; h++) {
    hourMap[`${h}hs`] = 0
  }
  todaySales?.forEach(sale => {
    const saleAR = toZonedTime(new Date(sale.created_at), TZ)
    const h = saleAR.getHours()
    const label = `${h}hs`
    if (label in hourMap) hourMap[label] = (hourMap[label] ?? 0) + sale.total
  })
  const chartData = Object.entries(hourMap).map(([hour, total]) => ({ hour, total }))

  // Top 5 products by quantity
  const productTotals: Record<string, { name: string; quantity: number; total: number }> = {}
  saleItemsToday?.forEach(item => {
    const key = item.product_id ?? item.name
    if (!productTotals[key]) productTotals[key] = { name: item.name, quantity: 0, total: 0 }
    productTotals[key].quantity += item.quantity
    productTotals[key].total += item.subtotal
  })
  const topProducts = Object.values(productTotals)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  // Recent sales (last 8)
  const recentSales = (todaySales ?? []).slice(0, 8).map(s => ({
    id: s.id,
    sale_number: s.sale_number,
    total: s.total,
    payment_method: s.payment_method,
    completed_at: s.completed_at,
    created_at: s.created_at,
    customer_name: (s.customers as any)?.full_name ?? null,
  }))

  const stats = [
    {
      title: 'Facturado hoy',
      value: formatARS(totalHoy),
      description: `${cantidadHoy} venta${cantidadHoy !== 1 ? 's' : ''}`,
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      accent: true,
    },
    {
      title: 'Transacciones',
      value: cantidadHoy.toString(),
      description: 'Ventas del día',
      icon: ShoppingCart,
      iconColor: 'text-slate-500',
      iconBg: 'bg-slate-100',
      accent: false,
    },
    {
      title: 'Productos activos',
      value: (totalProducts ?? 0).toString(),
      description: 'En catálogo',
      icon: Package,
      iconColor: 'text-slate-500',
      iconBg: 'bg-slate-100',
      accent: false,
    },
    {
      title: 'Alertas de stock',
      value: (lowStockCount ?? 0).toString(),
      description: lowStockCount ? 'Requieren atención' : 'Todo en orden',
      icon: AlertTriangle,
      iconColor: (lowStockCount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-400',
      iconBg: (lowStockCount ?? 0) > 0 ? 'bg-amber-100' : 'bg-slate-100',
      accent: false,
    },
  ]

  const dateLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: TZ,
  }).format(nowUtc)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-foreground">Buen día</h1>
          <p className="text-sm text-muted-foreground">
            {org.name} — <span className="capitalize">{dateLabel}</span>
          </p>
        </div>
        {openSession && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Caja abierta · {formatARS(openSession.opening_amount)}
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className={`rounded-xl border p-5 bg-white ${stat.accent ? 'border-emerald-200 bg-emerald-50' : 'border-border'}`}
            >
              <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{stat.title}</p>
              <p className={`text-2xl font-bold tracking-tight ${stat.accent ? 'text-emerald-700' : 'text-foreground'}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
            </div>
          )
        })}
      </div>

      {/* Chart + top products */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Ventas por hora</p>
            <p className="text-xs text-muted-foreground mt-0.5">Facturación acumulada del día</p>
          </div>
          <div className="p-4">
            <SalesChart data={chartData} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Top productos</p>
            <p className="text-xs text-muted-foreground mt-0.5">Por unidades vendidas hoy</p>
          </div>
          <div className="p-4">
            <TopProductsTable products={topProducts} />
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Últimas ventas</p>
          <p className="text-xs text-muted-foreground mt-0.5">Ventas completadas hoy</p>
        </div>
        <RecentSales sales={recentSales} />
      </div>
    </div>
  )
}
