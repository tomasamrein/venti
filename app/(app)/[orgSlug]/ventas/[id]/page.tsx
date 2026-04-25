import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, User, CreditCard, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatARS } from '@/lib/utils/currency'

interface Props {
  params: Promise<{ orgSlug: string; id: string }>
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'Completada', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  on_hold: { label: 'En espera', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  canceled: { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  refunded: { label: 'Reembolsada', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo', debit: 'Débito', credit: 'Crédito',
  transfer: 'Transferencia', mercadopago: 'MercadoPago',
  current_account: 'Cta. corriente', mixed: 'Mixto',
}

export default async function VentaDetailPage({ params }: Props) {
  const { orgSlug, id } = await params
  const supabase = await createClient()

  const { data: sale } = await supabase
    .from('sales')
    .select('*, customers(full_name, phone, dni), sale_items(*)')
    .eq('id', id)
    .single()

  if (!sale) notFound()

  const statusInfo = STATUS_LABELS[sale.status] ?? { label: sale.status, color: 'text-muted-foreground' }
  const customer = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers as { full_name: string; phone: string | null; dni: string | null } | null
  const items = Array.isArray(sale.sale_items) ? sale.sale_items : []

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/ventas`} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-extrabold tracking-[-0.03em]">
              Venta {sale.sale_number ? `#${sale.sale_number}` : sale.id.slice(0, 8)}
            </h1>
            <Badge variant="outline" className={`text-[11px] border ${statusInfo.color}`}>
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-[13px] text-muted-foreground">
            {new Date(sale.created_at).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            {new Date(sale.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.07] bg-card card-shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-4 w-4 text-indigo-400" />
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Cliente</p>
          </div>
          {customer ? (
            <>
              <p className="text-[14px] font-semibold">{customer.full_name}</p>
              {customer.phone && <p className="text-[12px] text-muted-foreground">{customer.phone}</p>}
            </>
          ) : (
            <p className="text-[14px] text-muted-foreground">Sin cliente</p>
          )}
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-card card-shadow p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-violet-400" />
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Pago</p>
          </div>
          <p className="text-[14px] font-semibold">{METHOD_LABELS[sale.payment_method] ?? sale.payment_method}</p>
          {sale.amount_paid && (
            <p className="text-[12px] text-muted-foreground">
              Pagó {formatARS(sale.amount_paid)} · Vuelto {formatARS(sale.change_amount ?? 0)}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[14px] font-semibold">Productos ({items.length})</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {items.map((item: { id: string; name: string; quantity: number; unit_price: number; discount_pct: number; subtotal: number; barcode: string | null }) => (
            <div key={item.id} className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium">{item.name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {item.quantity} × {formatARS(item.unit_price)}
                  {item.discount_pct > 0 && <span className="ml-2 text-amber-400">−{item.discount_pct}%</span>}
                </p>
              </div>
              <p className="text-[14px] font-bold">{formatARS(item.subtotal)}</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-white/[0.05] bg-white/[0.01] space-y-2">
          <div className="flex justify-between text-[13px] text-muted-foreground">
            <span>Subtotal</span><span>{formatARS(sale.subtotal)}</span>
          </div>
          {sale.discount_amount > 0 && (
            <div className="flex justify-between text-[13px] text-amber-400">
              <span>Descuento ({sale.discount_pct}%)</span><span>−{formatARS(sale.discount_amount)}</span>
            </div>
          )}
          {sale.tax_amount > 0 && (
            <div className="flex justify-between text-[13px] text-muted-foreground">
              <span>IVA</span><span>{formatARS(sale.tax_amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-[16px] font-extrabold pt-2 border-t border-white/[0.05]">
            <span>Total</span><span>{formatARS(sale.total)}</span>
          </div>
        </div>
      </div>

      {sale.notes && (
        <div className="rounded-xl border border-white/[0.07] bg-card p-4">
          <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notas</p>
          <p className="text-[14px]">{sale.notes}</p>
        </div>
      )}
    </div>
  )
}
