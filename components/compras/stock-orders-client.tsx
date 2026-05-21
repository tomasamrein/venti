'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatARS, waEncode } from '@/lib/utils/currency'
import { StockOrderForm } from './stock-order-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OrderItem {
  product_name: string
  quantity: number
  unit_cost: number
  subtotal: number
}

interface Order {
  id: string
  supplier_name: string | null
  status: string
  total_cost: number
  ordered_at: string
  received_at: string | null
  notes: string | null
  stock_order_items: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: {
    label: 'Pendiente',
    icon: <Clock className="h-3.5 w-3.5" />,
    className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
  },
  received: {
    label: 'Recibida',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  },
  canceled: {
    label: 'Cancelada',
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
  },
}

export function StockOrdersClient({ orders: initial, orgSlug }: { orders: Order[]; orgSlug: string }) {
  const router = useRouter()
  const [orders, setOrders] = useState(initial)
  // Re-sincronizar cuando router.refresh() trae datos nuevos del servidor
  // (useState ignora cambios de prop tras el montaje → sin esto hay que apretar F5).
  useEffect(() => { setOrders(initial) }, [initial])
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  async function markReceived(orderId: string) {
    setUpdating(orderId)
    const res = await fetch('/api/stock-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'received' }),
    })
    if (!res.ok) { toast.error('Error al actualizar'); setUpdating(null); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'received', received_at: new Date().toISOString() } : o))
    toast.success('Orden marcada como recibida')
    setUpdating(null)
    router.refresh()
  }

  function shareWhatsApp(order: Order) {
    const date = new Date(order.ordered_at).toLocaleDateString('es-AR')
    const lines = order.stock_order_items.map(i =>
      `• ${i.product_name} — ${i.quantity} u. @ ${formatARS(i.unit_cost)} = ${formatARS(i.subtotal)}`
    ).join('\n')
    const header = order.supplier_name ? `Pedido para *${order.supplier_name}* (${date})` : `Pedido del ${date}`
    const text = `${header}:\n\n${lines}\n\n*Total: ${formatARS(order.total_cost)}*`
    window.open(`https://wa.me/?text=${waEncode(text)}`, '_blank')
  }

  async function cancelOrder(orderId: string) {
    setUpdating(orderId)
    const res = await fetch('/api/stock-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, status: 'canceled' }),
    })
    if (!res.ok) { toast.error('Error al cancelar'); setUpdating(null); return }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'canceled' } : o))
    toast.success('Orden cancelada')
    setUpdating(null)
  }

  const totalPending = orders.filter(o => o.status === 'pending').reduce((s, o) => s + o.total_cost, 0)
  const totalReceived = orders.filter(o => o.status === 'received').reduce((s, o) => s + o.total_cost, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Órdenes de compra</h1>
          <p className="text-[14px] text-muted-foreground mt-0.5">Registrá tus pedidos a proveedores y controlá el gasto en stock</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Nueva orden
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pendiente de recibir</p>
          <p className="text-[22px] font-extrabold tracking-tight text-amber-600">{formatARS(totalPending)}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{orders.filter(o => o.status === 'pending').length} órdenes</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recibido (historial)</p>
          <p className="text-[22px] font-extrabold tracking-tight text-emerald-600">{formatARS(totalReceived)}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">{orders.filter(o => o.status === 'received').length} órdenes</p>
        </div>
      </div>

      {/* Orders list */}
      {!orders.length ? (
        <div className="rounded-xl border border-border bg-card flex flex-col items-center justify-center py-16 gap-3">
          <Package className="h-10 w-10 text-slate-300" />
          <p className="text-[14px] font-semibold text-muted-foreground">Sin órdenes registradas</p>
          <p className="text-[13px] text-muted-foreground">Creá tu primera orden para empezar a trackear gastos de stock</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {orders.map(order => {
            const status = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending
            const isExpanded = expanded === order.id
            return (
              <div key={order.id}>
                <div className="px-5 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[14px] font-semibold">
                        {order.supplier_name ?? 'Sin proveedor'}
                      </p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${status.className}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {new Date(order.ordered_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {order.received_at && ` · Recibida ${new Date(order.received_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}`}
                      {order.notes && ` · ${order.notes}`}
                    </p>
                  </div>
                  <p className="text-[16px] font-extrabold">{formatARS(order.total_cost)}</p>
                  <div className="flex items-center gap-2">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          size="sm" variant="outline"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-900/20 h-8 text-[12px]"
                          onClick={() => markReceived(order.id)}
                          disabled={updating === order.id}
                        >
                          Marcar recibida
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          className="text-destructive hover:text-destructive h-8 text-[12px]"
                          onClick={() => cancelOrder(order.id)}
                          disabled={updating === order.id}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    <button
                      onClick={() => shareWhatsApp(order)}
                      title="Compartir por WhatsApp"
                      className="h-8 w-8 flex items-center justify-center rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && order.stock_order_items.length > 0 && (
                  <div className="px-5 pb-4 bg-muted/20">
                    <table className="w-full text-[12px]">
                      <thead>
                        <tr className="border-b border-border">
                          {['Producto', 'Cant.', 'Costo unit.', 'Subtotal'].map(h => (
                            <th key={h} className="py-2 text-left text-[11px] font-semibold text-muted-foreground pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {order.stock_order_items.map((item, i) => (
                          <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-4 font-medium">{item.product_name}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{item.quantity}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{formatARS(item.unit_cost)}</td>
                            <td className="py-2 font-semibold">{formatARS(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showForm && <StockOrderForm onClose={() => setShowForm(false)} />}
    </div>
  )
}
