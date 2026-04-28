import { formatARS } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
  current_account: 'Cta. Cte.',
  mixed: 'Mixto',
}

interface RecentSale {
  id: string
  sale_number: number | null
  total: number
  payment_method: string
  completed_at: string | null
  created_at: string
  customer_name: string | null
}

interface RecentSalesProps {
  sales: RecentSale[]
}

export function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Sin ventas hoy
      </div>
    )
  }

  return (
    <div className="divide-y divide-border/50">
      {sales.map(sale => (
        <div key={sale.id} className="flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-emerald-500">
                #{sale.sale_number ?? '—'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">
                {sale.customer_name ?? 'Consumidor final'}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(sale.completed_at ?? sale.created_at), 'HH:mm', { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs hidden sm:flex">
              {METHOD_LABELS[sale.payment_method] ?? sale.payment_method}
            </Badge>
            <span className="text-sm font-bold text-emerald-500">
              {formatARS(sale.total)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
