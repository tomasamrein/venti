import { formatARS } from '@/lib/utils/currency'
import { formatInTimeZone } from 'date-fns-tz'
import { Badge } from '@/components/ui/badge'

const TZ = 'America/Argentina/Buenos_Aires'

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
    <div className="divide-y divide-border">
      {sales.map(sale => (
        <div key={sale.id} className="flex items-center justify-between py-3 px-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-slate-600">
                #{sale.sale_number ?? '—'}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {sale.customer_name ?? 'Consumidor final'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatInTimeZone(new Date(sale.completed_at ?? sale.created_at), TZ, 'HH:mm')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs hidden sm:flex text-slate-600">
              {METHOD_LABELS[sale.payment_method] ?? sale.payment_method}
            </Badge>
            <span className="text-sm font-bold text-emerald-700">
              {formatARS(sale.total)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
