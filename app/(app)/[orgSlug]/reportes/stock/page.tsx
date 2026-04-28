import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatARS } from '@/lib/utils/currency'
import { Package, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ filter?: string; q?: string }>
}

export default async function ReportesStockPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { filter, q } = await searchParams
  const supabase = await createClient()

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  let query = supabase
    .from('products')
    .select('id, name, barcode, sku, price_sell, price_cost, stock_current, stock_min, track_stock, is_active, product_categories(name)')
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .order('stock_current', { ascending: true })

  if (q) query = query.ilike('name', `%${q}%`)
  // low/out filtering is done client-side below

  const { data: products } = await query

  // Filter client-side for low/out stock
  const allProducts = products ?? []
  const filtered = filter === 'low'
    ? allProducts.filter(p => p.track_stock && p.stock_current <= p.stock_min && p.stock_current > 0)
    : filter === 'out'
    ? allProducts.filter(p => p.track_stock && p.stock_current <= 0)
    : allProducts

  const totalProducts = allProducts.length
  const lowStockCount = allProducts.filter(p => p.track_stock && p.stock_current <= p.stock_min && p.stock_current > 0).length
  const outStockCount = allProducts.filter(p => p.track_stock && p.stock_current <= 0).length
  const stockValue = allProducts.reduce((s, p) => s + (p.price_cost ?? 0) * Math.max(0, p.stock_current), 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Reporte de stock</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Estado actual del inventario</p>
        </div>
        <form className="flex gap-2" method="GET">
          <input type="search" name="q" placeholder="Buscar producto..." defaultValue={q ?? ''}
            className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-foreground w-48" />
          <select name="filter" defaultValue={filter ?? ''}
            className="h-9 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[13px] text-foreground">
            <option value="">Todo el stock</option>
            <option value="low">Stock bajo</option>
            <option value="out">Sin stock</option>
          </select>
          <button type="submit" className="h-9 px-4 rounded-xl text-[13px] font-medium text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            Filtrar
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Productos', value: String(totalProducts), icon: Package, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { label: 'Stock bajo', value: String(lowStockCount), icon: TrendingDown, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Sin stock', value: String(outStockCount), icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'Valor inventario', value: formatARS(stockValue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <h2 className="text-[14px] font-semibold">Inventario</h2>
          <span className="text-[12px] text-muted-foreground">{filtered.length} productos</span>
        </div>
        {!filtered.length
          ? <p className="text-center py-10 text-[14px] text-muted-foreground">Sin productos</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    {['Producto', 'Categoría', 'Stock', 'Mínimo', 'Precio costo', 'Precio venta', 'Valor stock'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filtered.map(p => {
                    const isOut = p.track_stock && p.stock_current <= 0
                    const isLow = p.track_stock && !isOut && p.stock_current <= p.stock_min
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3">
                          <p className="font-medium">{p.name}</p>
                          {p.barcode && <p className="text-[11px] text-muted-foreground font-mono">{p.barcode}</p>}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {(p.product_categories as { name: string } | null)?.name ?? '—'}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`font-bold ${isOut ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {p.stock_current}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{p.stock_min}</td>
                        <td className="px-5 py-3 text-muted-foreground">{p.price_cost ? formatARS(p.price_cost) : '—'}</td>
                        <td className="px-5 py-3">{formatARS(p.price_sell)}</td>
                        <td className="px-5 py-3 font-medium">
                          {p.price_cost ? formatARS(p.price_cost * Math.max(0, p.stock_current)) : '—'}
                        </td>
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
