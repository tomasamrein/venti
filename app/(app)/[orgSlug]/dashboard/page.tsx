import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, DollarSign, Package, AlertTriangle, TrendingUp, ArrowUpRight } from 'lucide-react'
import { formatARS } from '@/lib/utils/currency'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function DashboardPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todaySales } = await supabase
    .from('sales')
    .select('total')
    .eq('organization_id', org?.id ?? '')
    .eq('status', 'completed')
    .gte('created_at', today.toISOString())

  const totalHoy = todaySales?.reduce((sum, s) => sum + s.total, 0) ?? 0
  const cantidadHoy = todaySales?.length ?? 0

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org?.id ?? '')
    .eq('is_active', true)

  const { count: lowStockCount } = await supabase
    .from('stock_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', org?.id ?? '')
    .eq('is_resolved', false)

  const stats = [
    {
      title: 'Facturado hoy',
      value: formatARS(totalHoy),
      description: `${cantidadHoy} venta${cantidadHoy !== 1 ? 's' : ''} completada${cantidadHoy !== 1 ? 's' : ''}`,
      icon: DollarSign,
      color: 'from-emerald-500/20 to-emerald-500/5',
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      trend: '+12% vs ayer',
      trendUp: true,
    },
    {
      title: 'Transacciones',
      value: cantidadHoy.toString(),
      description: 'Ventas del día',
      icon: ShoppingCart,
      color: 'from-violet-500/20 to-violet-500/5',
      iconColor: 'text-violet-400',
      iconBg: 'bg-violet-500/10',
      trend: null,
      trendUp: true,
    },
    {
      title: 'Productos activos',
      value: (totalProducts ?? 0).toString(),
      description: 'En catálogo',
      icon: Package,
      color: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      trend: null,
      trendUp: true,
    },
    {
      title: 'Alertas de stock',
      value: (lowStockCount ?? 0).toString(),
      description: 'Requieren atención',
      icon: AlertTriangle,
      color: (lowStockCount ?? 0) > 0 ? 'from-amber-500/20 to-amber-500/5' : 'from-slate-500/10 to-slate-500/5',
      iconColor: (lowStockCount ?? 0) > 0 ? 'text-amber-400' : 'text-slate-400',
      iconBg: (lowStockCount ?? 0) > 0 ? 'bg-amber-500/10' : 'bg-slate-500/10',
      trend: null,
      trendUp: false,
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em] text-foreground">
          Buen día 👋
        </h1>
        <p className="text-[14px] text-muted-foreground">
          Resumen de{' '}
          <span className="text-foreground font-medium">{org?.name}</span>
          {' '}— {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.title}
              className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-card card-shadow p-5 group transition-colors hover:border-white/[0.12]"
            >
              {/* Gradient blob */}
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-60`} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                    <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                  {stat.trend && (
                    <span className={`flex items-center gap-0.5 text-[11px] font-medium ${stat.trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                      <ArrowUpRight className="h-3 w-3" />
                      {stat.trend}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[12px] font-medium text-muted-foreground tracking-wide">{stat.title}</p>
                  <p className="text-[26px] font-extrabold tracking-[-0.03em] text-foreground leading-none">{stat.value}</p>
                  <p className="text-[12px] text-muted-foreground">{stat.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Placeholder chart area */}
      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.02em]">Ventas recientes</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">Últimas transacciones del día</p>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5" />
            Gráficos en próxima versión
          </div>
        </div>
        <div className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-violet-400" />
          </div>
          <p className="text-[14px] font-medium text-foreground mb-1">Dashboard en construcción</p>
          <p className="text-[13px] text-muted-foreground">
            Los gráficos de ventas por hora estarán disponibles en la Fase 6.
          </p>
        </div>
      </div>
    </div>
  )
}
