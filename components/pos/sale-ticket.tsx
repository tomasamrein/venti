'use client'

import { useRef } from 'react'
import { Printer, MessageCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatARS } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SaleItem {
  name: string
  quantity: number
  unit_price: number
  subtotal: number
}

interface SaleTicketProps {
  open: boolean
  onClose: () => void
  sale: {
    id: string
    sale_number?: number | null
    completed_at?: string | null
    payment_method: string
    subtotal: number
    discount_amount: number
    total: number
    amount_paid?: number | null
    change_amount?: number | null
    items: SaleItem[]
    org_name?: string
    org_address?: string
    org_phone?: string
  }
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debit: 'Débito',
  credit: 'Crédito',
  transfer: 'Transferencia',
  mercadopago: 'Mercado Pago',
  current_account: 'Cta. Corriente',
  mixed: 'Mixto',
}

export function SaleTicket({ open, onClose, sale }: SaleTicketProps) {
  const ticketRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const content = ticketRef.current?.innerHTML
    if (!content) return

    const win = window.open('', '_blank', 'width=400,height=700')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Ticket de venta</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 4mm; }
          .ticket-header { text-align: center; margin-bottom: 8px; }
          .ticket-header h1 { font-size: 20px; font-weight: bold; }
          .ticket-header p { font-size: 11px; color: #444; }
          .divider { border-top: 1px dashed #666; margin: 6px 0; }
          .ticket-meta { font-size: 11px; margin-bottom: 6px; }
          .ticket-meta p { display: flex; justify-content: space-between; }
          .items-header { display: flex; font-weight: bold; font-size: 11px; padding-bottom: 2px; }
          .item-row { display: flex; font-size: 11px; padding: 2px 0; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 55px; text-align: right; }
          .totals { margin-top: 6px; font-size: 12px; }
          .totals p { display: flex; justify-content: space-between; padding: 2px 0; }
          .totals .total-line { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px; }
          .ticket-footer { text-align: center; font-size: 10px; color: #666; margin-top: 10px; }
          @media print {
            html, body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  function handleWhatsApp() {
    const date = sale.completed_at
      ? format(new Date(sale.completed_at), 'dd/MM/yyyy HH:mm', { locale: es })
      : format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })

    const lines = [
      `*${sale.org_name || 'Venti POS'}*`,
      `Ticket #${sale.sale_number ?? sale.id.slice(0, 8)}`,
      `Fecha: ${date}`,
      ``,
      sale.items.map(i =>
        `${i.quantity}× ${i.name} — ${formatARS(i.subtotal)}`
      ).join('\n'),
      ``,
      sale.discount_amount > 0 ? `Descuento: -${formatARS(sale.discount_amount)}` : null,
      `*Total: ${formatARS(sale.total)}*`,
      `Pago: ${PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}`,
    ].filter(Boolean).join('\n')

    const url = `https://wa.me/?text=${encodeURIComponent(lines)}`
    window.open(url, '_blank')
  }

  const date = sale.completed_at
    ? format(new Date(sale.completed_at), 'dd/MM/yyyy HH:mm', { locale: es })
    : format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Ticket de venta</DialogTitle>
        </DialogHeader>

        {/* Ticket preview */}
        <div
          ref={ticketRef}
          className="font-mono text-xs border rounded-xl p-4 bg-white text-black dark:bg-white"
        >
          {/* Header */}
          <div className="ticket-header text-center mb-3">
            <h1 className="text-lg font-bold">{sale.org_name || 'Venti POS'}</h1>
            {sale.org_address && <p className="text-[10px] text-gray-600">{sale.org_address}</p>}
            {sale.org_phone && <p className="text-[10px] text-gray-600">Tel: {sale.org_phone}</p>}
          </div>

          <div className="divider border-t border-dashed border-gray-400 my-2" />

          {/* Meta */}
          <div className="ticket-meta mb-2 text-[11px]">
            <div className="flex justify-between">
              <span>Ticket</span>
              <span>#{sale.sale_number ?? sale.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Fecha</span>
              <span>{date}</span>
            </div>
            <div className="flex justify-between">
              <span>Pago</span>
              <span>{PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method}</span>
            </div>
          </div>

          <div className="divider border-t border-dashed border-gray-400 my-2" />

          {/* Items header */}
          <div className="flex text-[10px] font-bold mb-1">
            <span className="flex-1">Producto</span>
            <span className="w-8 text-center">Cant</span>
            <span className="w-16 text-right">Importe</span>
          </div>

          {/* Items */}
          {sale.items.map((item, i) => (
            <div key={i} className="flex text-[11px] py-0.5">
              <span className="flex-1 truncate">{item.name}</span>
              <span className="w-8 text-center">{item.quantity}</span>
              <span className="w-16 text-right">{formatARS(item.subtotal)}</span>
            </div>
          ))}

          <div className="divider border-t border-dashed border-gray-400 my-2" />

          {/* Totals */}
          <div className="totals text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatARS(sale.subtotal)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Descuento</span>
                <span>-{formatARS(sale.discount_amount)}</span>
              </div>
            )}
            <div className="total-line flex justify-between font-bold text-sm border-t border-black pt-1 mt-1">
              <span>TOTAL</span>
              <span>{formatARS(sale.total)}</span>
            </div>
            {sale.payment_method === 'cash' && sale.amount_paid != null && (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Recibido</span>
                  <span>{formatARS(sale.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Vuelto</span>
                  <span>{formatARS(sale.change_amount ?? 0)}</span>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="ticket-footer text-center text-[10px] text-gray-500 mt-4">
            <p>¡Gracias por su compra!</p>
            <p className="mt-1">Powered by Venti</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 gap-2 rounded-xl"
            onClick={handlePrint}
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button
            className="flex-1 gap-2 rounded-xl bg-green-600 hover:bg-green-700"
            onClick={handleWhatsApp}
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </Button>
        </div>

        <Button
          variant="outline"
          className="w-full rounded-xl"
          onClick={onClose}
        >
          Cerrar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
