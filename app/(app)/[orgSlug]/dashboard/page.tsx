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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">¡Buen día! 👋</h1>
        <p className="text-muted-foreground">Esto es lo que pasó hoy en {org?.name}.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              {stat.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ventas recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Los gráficos e historial de ventas estarán disponibles próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
