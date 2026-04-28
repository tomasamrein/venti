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
    <div className="space-y-3">
      {products.map((p, i) => (
        <div key={p.name} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-4 text-right">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium truncate">{p.name}</span>
              <span className="text-xs text-muted-foreground ml-2 shrink-0">{p.quantity} un.</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${(p.quantity / maxQty) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold text-right w-24 shrink-0">
            {formatARS(p.total)}
          </span>
        </div>
      ))}
    </div>
  )
}
