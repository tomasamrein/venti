import { formatARS } from '@/lib/utils/currency'
import { Package } from 'lucide-react'

interface TopProduct {
  name: string
  quantity: number
  total: number
}

interface TopProductsTableProps {
  products: TopProduct[]
}

export function TopProductsTable({ products }: TopProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Sin ventas hoy
      </div>
    )
  }

  const maxQty = Math.max(...products.map(p => p.quantity), 1)

  return (
    <div className="space-y-4">
      {products.map((p, i) => (
        <div key={p.name} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-slate-400 w-4 shrink-0">{i + 1}</span>
              <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground">{p.quantity} un.</span>
              <span className="text-sm font-semibold text-emerald-700">{formatARS(p.total)}</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${(p.quantity / maxQty) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
