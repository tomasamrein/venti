import { createClient } from '@/lib/supabase/server'
import { getOrgBySlug } from '@/lib/supabase/get-org'
import { ShoppingCart, DollarSign, Package, AlertTriangle } from 'lucide-react'
import { formatARS } from '@/lib/utils/currency'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { TopProductsTable } from '@/components/dashboard/top-products-table'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner'
import { DashboardFilters } from '@/components/dashboard/dashboard-filters'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { startOfDay, startOfMonth, startOfYear, getDaysInMonth, format } from 'date-fns'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ period?: string; branch?: string }>
}

const TZ = 'America/Argentina/Buenos_Aires'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default async function DashboardPage({ params, searchParams }: Props) {
  const [{ orgSlug }, sp] = await Promise.all([params, searchParams])
  const period = sp.period === 'month' || sp.period === 'year' ? sp.period : 'day'

  const [supabase, org] = await Promise.all([createClient(), getOrgBySlug(orgSlug)])
  if (!org) return null

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: membership }, { data: subscription }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('role, branch_id')
      .eq('organization_id', org.id)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('subscription_plans(type)')
      .eq('organization_id', org.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle(),
  ])

  const planType = (subscription?.subscription_plans as any)?.type ?? 'free_trial'
  const isPro = planType === 'pro'

  // Branches for pro plan
  let branches: { id: string; name: string }[] = []
  if (isPro) {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('is_main', { ascending: false })
    branches = data ?? []
  }

  // Determine active branch
  const activeBranchId = isPro
    ? (sp.branch && sp.branch !== 'all' ? sp.branch : null)
    : (membership?.branch_id ?? null)

  // Date range in AR timezone
  const nowUtc = new Date()
  const nowAR = toZonedTime(nowUtc, TZ)

  let startDateAR: Date
  if (period === 'year') {
    startDateAR = startOfYear(nowAR)
  } else if (period === 'month') {
    startDateAR = startOfMonth(nowAR)
  } else {
    startDateAR = startOfDay(nowAR)
  }
  const startISO = fromZonedTime(startDateAR, TZ).toISOString()

  // Build sales query
  let salesQuery = supabase
    .from('sales')
    .select('id, total, payment_method, completed_at, created_at, sale_number, customers(full_name)')
    .eq('organization_id', org.id)
    .eq('status', 'completed')
    .gte('created_at', startISO)
    .order('created_at', { ascending: false })

  if (activeBranchId) salesQuery = salesQuery.eq('branch_id', activeBranchId)

  const [
    { data: sales },
    { count: totalProducts },
    { count: lowStockCount },
    { data: openSession },
  ] = await Promise.all([
    salesQuery,
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
    supabase.from('stock_alerts').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_resolved', false),
    supabase.from('cash_sessions').select('opening_amount').eq('organization_id', org.id).eq('status', 'open').maybeSingle(),
  ])

  // Fetch items filtered by the fetched sale IDs
  const saleIds = (sales ?? []).map(s => s.id)
  let saleItems: { product_id: string | null; name: string; quantity: number; subtotal: number }[] = []
  if (saleIds.length > 0) {
    const { data } = await supabase
      .from('sale_items')
      .select('product_id, name, quantity, subtotal')
      .in('sale_id', saleIds.slice(0, 500))
    saleItems = data ?? []
  }

  const totalAmount = sales?.reduce((s, v) => s + v.total, 0) ?? 0
  const totalCount = sales?.length ?? 0

  // Chart data
  let chartData: { label: string; total: number }[] = []
  if (period === 'day') {
    const hourMap: Record<string, number> = {}
    for (let h = 8; h <= 22; h++) hourMap[`${h}hs`] = 0
    sales?.forEach(sale => {
      const h = toZonedTime(new Date(sale.created_at), TZ).getHours()
      const key = `${h}hs`
      if (key in hourMap) hourMap[key] = (hourMap[key] ?? 0) + sale.total
    })
    chartData = Object.entries(hourMap).map(([label, total]) => ({ label, total }))
  } else if (period === 'month') {
    const days = getDaysInMonth(nowAR)
    const dayMap: Record<number, number> = {}
    for (let d = 1; d <= days; d++) dayMap[d] = 0
    sales?.forEach(sale => {
      const d = toZonedTime(new Date(sale.created_at), TZ).getDate()
      dayMap[d] = (dayMap[d] ?? 0) + sale.total
    })
    chartData = Object.entries(dayMap).map(([d, total]) => ({ label: d.toString(), total }))
  } else {
    const monthMap: Record<number, number> = {}
    for (let m = 0; m < 12; m++) monthMap[m] = 0
    sales?.forEach(sale => {
      const m = toZonedTime(new Date(sale.created_at), TZ).getMonth()
      monthMap[m] = (monthMap[m] ?? 0) + sale.total
    })
    chartData = Object.entries(monthMap).map(([m, total]) => ({ label: MONTHS[Number(m)], total }))
  }

  // Top 5 products
  const productTotals: Record<string, { name: string; quantity: number; total: number }> = {}
  saleItems.forEach(item => {
    const key = item.product_id ?? item.name
    if (!productTotals[key]) productTotals[key] = { name: item.name, quantity: 0, total: 0 }
    productTotals[key].quantity += item.quantity
    productTotals[key].total += item.subtotal
  })
  const topProducts = Object.values(productTotals).sort((a, b) => b.quantity - a.quantity).slice(0, 5)

  // Recent sales (last 8)
  const recentSales = (sales ?? []).slice(0, 8).map(s => ({
    id: s.id,
    sale_number: s.sale_number,
    total: s.total,
    payment_method: s.payment_method,
    completed_at: s.completed_at,
    created_at: s.created_at,
    customer_name: (s.customers as any)?.full_name ?? null,
  }))

  const periodLabel = period === 'year' ? 'este año' : period === 'month' ? 'este mes' : 'hoy'
  const chartSubtitle = period === 'day' ? 'por hora' : period === 'month' ? 'por día' : 'por mes'

  const dateLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ,
  }).format(nowUtc)

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-foreground">Buen día</h1>
          <p className="text-sm text-muted-foreground">
            {org.name} — <span className="capitalize">{dateLabel}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {openSession && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Caja abierta · {formatARS(openSession.opening_amount)}
            </div>
          )}
          <DashboardFilters
            orgSlug={orgSlug}
            isPro={isPro}
            branches={branches}
            activePeriod={period}
            activeBranchId={activeBranchId}
          />
        </div>
      </div>

      <OnboardingBanner
        orgSlug={orgSlug}
        hasProducts={(totalProducts ?? 0) > 0}
        hasSales={totalCount > 0}
        hasCashSession={openSession !== null}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Ingreso acumulado</p>
          <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">{formatARS(totalAmount)}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{periodLabel}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Transacciones</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">Ventas {periodLabel}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Productos activos</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{totalProducts ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">En catálogo</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${(lowStockCount ?? 0) > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'}`}>
            <AlertTriangle className={`h-5 w-5 ${(lowStockCount ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Alertas de stock</p>
          <p className={`text-2xl font-bold tracking-tight ${(lowStockCount ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
            {lowStockCount ?? 0}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {(lowStockCount ?? 0) > 0 ? 'Requieren atención' : 'Todo en orden'}
          </p>
        </div>
      </div>

      {/* Chart + top products */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Ventas {chartSubtitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">Facturación acumulada {periodLabel}</p>
          </div>
          <div className="p-4">
            <SalesChart data={chartData} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Top productos</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">Por unidades vendidas {periodLabel}</p>
          </div>
          <div className="p-4">
            <TopProductsTable products={topProducts} />
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Últimas ventas</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">Ventas completadas {periodLabel}</p>
        </div>
        <RecentSales sales={recentSales} />
      </div>
    </div>
  )
}
