import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, DollarSign, Package, TrendingUp } from 'lucide-react'

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
      title: 'Ventas hoy',
      value: new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalHoy),
      description: `${cantidadHoy} transacciones`,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Ventas del día',
      value: cantidadHoy.toString(),
      description: 'Completadas hoy',
      icon: <ShoppingCart className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Productos activos',
      value: (totalProducts ?? 0).toString(),
      description: 'En catálogo',
      icon: <Package className="h-4 w-4 text-muted-foreground" />,
    },
    {
      title: 'Alertas de stock',
      value: (lowStockCount ?? 0).toString(),
      description: 'Productos con stock bajo',
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-poppins">¡Buen día! 👋</h1>
        <p className="text-muted-foreground">Esto es lo que pasó hoy en <span className="font-semibold text-foreground">{org?.name}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border border-border/60 bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className="p-2 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent font-poppins">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border border-border/60 bg-gradient-to-br from-card to-card/80 dark:from-card dark:to-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-poppins">Ventas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-12">
            Los gráficos e historial de ventas estarán disponibles próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
