'use client'

import { useQuery } from '@tanstack/react-query'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { ShoppingCart, DollarSign, Package, AlertTriangle, Building2, ChevronDown } from 'lucide-react'
import { formatARS } from '@/lib/utils/currency'
import { SalesChart } from '@/components/dashboard/sales-chart'
import { TopProductsTable } from '@/components/dashboard/top-products-table'
import { RecentSales } from '@/components/dashboard/recent-sales'
import { OnboardingChecklist } from '@/components/dashboard/onboarding-checklist'

interface Branch { id: string; name: string }

interface DashboardClientProps {
  orgSlug: string
  isPro: boolean
  branches: Branch[]
  defaultPeriod: string
  defaultBranchId: string | null
}

interface DashboardData {
  totalAmount: number
  totalCount: number
  totalProducts: number
  lowStockCount: number
  openSession: { opening_amount: number } | null
  chartData: { label: string; total: number }[]
  topProducts: { name: string; quantity: number; total: number }[]
  recentSales: {
    id: string
    sale_number: number | null
    total: number
    payment_method: string
    completed_at: string | null
    created_at: string
    customer_name: string | null
  }[]
}

const PERIODS = [
  { key: 'day', label: 'Hoy' },
  { key: 'month', label: 'Este mes' },
  { key: 'year', label: 'Este año' },
]

async function fetchDashboard(orgSlug: string, period: string, branchId: string | null): Promise<DashboardData> {
  const params = new URLSearchParams({ orgSlug, period })
  if (branchId) params.set('branchId', branchId)
  const res = await fetch(`/api/dashboard?${params}`)
  if (!res.ok) throw new Error('Failed to fetch dashboard data')
  return res.json()
}

function StatSkeleton() {
  return <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
}

export function DashboardClient({ orgSlug, isPro, branches, defaultPeriod, defaultBranchId }: DashboardClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const period = (searchParams.get('period') ?? defaultPeriod) as string
  const activeBranchId = isPro
    ? (searchParams.get('branch') && searchParams.get('branch') !== 'all' ? searchParams.get('branch') : null)
    : defaultBranchId

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', orgSlug, period, activeBranchId],
    queryFn: () => fetchDashboard(orgSlug, period, activeBranchId),
    staleTime: 60_000,
  })

  const navigate = useCallback((newPeriod: string, branch?: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', newPeriod)
    if (branch !== undefined) {
      if (branch) params.set('branch', branch)
      else params.delete('branch')
    }
    // replace instead of push — no history clutter
    router.replace(`/${orgSlug}/dashboard?${params.toString()}`, { scroll: false })
  }, [router, searchParams, orgSlug])

  const periodLabel = period === 'year' ? 'este año' : period === 'month' ? 'este mes' : 'hoy'
  const chartSubtitle = period === 'day' ? 'por hora' : period === 'month' ? 'por día' : 'por mes'

  const showOnboarding = !isLoading && data && (
    (data.totalProducts ?? 0) === 0 ||
    !data.openSession ||
    (data.totalCount ?? 0) === 0
  )

  return (
    <div className="space-y-6">
      {showOnboarding && (
        <OnboardingChecklist
          orgSlug={orgSlug}
          hasProducts={(data?.totalProducts ?? 0) > 0}
          hasOpenSession={!!data?.openSession}
          hasSales={(data?.totalCount ?? 0) > 0}
        />
      )}
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {data?.openSession && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Caja abierta · {formatARS(data.openSession.opening_amount)}
          </div>
        )}
        {/* Period tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => navigate(p.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === p.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isPro && branches.length > 1 && (
          <div className="relative">
            <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={activeBranchId ?? 'all'}
              onChange={e => navigate(period, e.target.value === 'all' ? null : e.target.value)}
              className="pl-8 pr-7 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas las sucursales</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-5">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mb-4">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Ingreso acumulado</p>
          {isLoading ? <StatSkeleton /> : (
            <p className="text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">{formatARS(data?.totalAmount ?? 0)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">{periodLabel}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Transacciones</p>
          {isLoading ? <StatSkeleton /> : (
            <p className="text-2xl font-bold tracking-tight text-foreground">{data?.totalCount ?? 0}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">Ventas {periodLabel}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center mb-4">
            <Package className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Productos activos</p>
          {isLoading ? <StatSkeleton /> : (
            <p className="text-2xl font-bold tracking-tight text-foreground">{data?.totalProducts ?? 0}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">En catálogo</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${(data?.lowStockCount ?? 0) > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-muted'}`}>
            <AlertTriangle className={`h-5 w-5 ${(data?.lowStockCount ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`} />
          </div>
          <p className="text-xs text-muted-foreground mb-1">Alertas de stock</p>
          {isLoading ? <StatSkeleton /> : (
            <p className={`text-2xl font-bold tracking-tight ${(data?.lowStockCount ?? 0) > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'}`}>
              {data?.lowStockCount ?? 0}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {(data?.lowStockCount ?? 0) > 0 ? 'Requieren atención' : 'Todo en orden'}
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
            {isLoading
              ? <div className="h-48 bg-muted animate-pulse rounded-lg" />
              : <SalesChart data={data?.chartData ?? []} />
            }
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">Top productos</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">Por unidades vendidas {periodLabel}</p>
          </div>
          <div className="p-4">
            {isLoading
              ? <div className="h-32 bg-muted animate-pulse rounded-lg" />
              : <TopProductsTable products={data?.topProducts ?? []} />
            }
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Últimas ventas</p>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">Ventas completadas {periodLabel}</p>
        </div>
        {isLoading
          ? <div className="h-32 bg-muted animate-pulse m-4 rounded-lg" />
          : <RecentSales sales={data?.recentSales ?? []} />
        }
      </div>
    </div>
  )
}
