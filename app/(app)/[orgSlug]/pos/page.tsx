'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ProductGrid } from '@/components/pos/product-grid'
import { CartSummary } from '@/components/pos/cart-summary'
import { PaymentModal } from '@/components/pos/payment-modal'
import { SaleTicket } from '@/components/pos/sale-ticket'
import { useCartStore } from '@/stores/cart-store'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
import { useOrg } from '@/hooks/use-org'
import { useCashSession } from '@/hooks/use-cash-session'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface SaleData {
  id: string
  sale_number: number | null
  payment_method: string
  subtotal: number
  discount_amount: number
  total: number
  amount_paid: number | null
  change_amount: number | null
  completed_at: string | null
  items: { name: string; quantity: number; unit_price: number; subtotal: number }[]
  org_name: string
  org_address?: string
  org_phone?: string
}

export default function POSPage() {
  const { org, branch, userId } = useOrg()
  const { session, isOpen } = useCashSession()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [ticketData, setTicketData] = useState<SaleData | null>(null)

  const cartItems = useCartStore(s => s.items)
  const cartDiscount = useCartStore(s => s.discount_pct)
  const customerId = useCartStore(s => s.customer_id)
  const getTotal = useCartStore(s => s.getTotal)
  const getSubtotal = useCartStore(s => s.getSubtotal)
  const clearCart = useCartStore(s => s.clear)
  const addItem = useCartStore(s => s.addItem)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('products')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => {
        setProducts(data || [])
        setLoading(false)
      })
  }, [org.id])

  useBarcodeScanner((barcode) => {
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      addItem(product, 1)
      toast.success(`${product.name} agregado`)
    } else {
      toast.error(`Código ${barcode} no encontrado`)
    }
  })

  const handleCheckout = () => {
    if (cartItems.length === 0) return toast.error('El carrito está vacío')
    if (!isOpen) return toast.error('No hay caja abierta. Abrí la caja primero.')
    setPaymentOpen(true)
  }

  const handleHoldSale = async () => {
    if (cartItems.length === 0) return toast.error('El carrito está vacío')
    if (!session) return toast.error('No hay caja abierta')

    try {
      const supabase = createClient()
      const label = `Venta ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`

      const { error } = await supabase.from('pending_sales').insert({
        organization_id: org.id,
        branch_id: branch.id,
        session_id: session.id,
        customer_id: customerId ?? null,
        label,
        items: cartItems.map(i => ({
          id: i.id,
          name: i.name,
          price_sell: i.price_sell,
          cart_quantity: i.cart_quantity,
          barcode: i.barcode,
          tax_rate: i.tax_rate,
        })),
        created_by: userId,
      })

      if (error) throw error
      clearCart()
      toast.success(`Venta guardada como "${label}"`)
    } catch {
      toast.error('Error al guardar la venta en espera')
    }
  }

  const handlePayment = async (method: string, amountPaid: number) => {
    if (!session) return

    const supabase = createClient()
    const subtotal = getSubtotal()
    const total = getTotal()
    const discountAmount = subtotal * (cartDiscount / 100)

    const itemsPayload = cartItems.map(item => ({
      product_id: item.id,
      name: item.name,
      barcode: item.barcode,
      unit_price: item.price_sell ?? 0,
      quantity: item.cart_quantity,
      discount_pct: item.cart_discount_pct ?? 0,
      tax_rate: item.tax_rate ?? 21,
      subtotal: (item.price_sell ?? 0) * item.cart_quantity,
    }))

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('complete_sale', {
        p_org_id: org.id,
        p_branch_id: branch.id,
        p_session_id: session.id,
        p_customer_id: customerId ?? null,
        p_payment_method: method as Database['public']['Enums']['payment_method'],
        p_subtotal: subtotal,
        p_discount_pct: cartDiscount,
        p_discount_amount: discountAmount,
        p_tax_amount: 0,
        p_total: total,
        p_amount_paid: amountPaid,
        p_change_amount: method === 'cash' ? amountPaid - total : 0,
        p_notes: null,
        p_items: itemsPayload,
      })

      if (error) throw error
      const result = Array.isArray(data) ? data[0] : data
      if (!result) throw new Error('La venta no se completó')

      setPaymentOpen(false)
      clearCart()
      setTicketData({
        id: result.sale_id,
        sale_number: result.sale_number,
        payment_method: method,
        subtotal,
        discount_amount: discountAmount,
        total,
        amount_paid: amountPaid,
        change_amount: method === 'cash' ? amountPaid - total : null,
        completed_at: new Date().toISOString(),
        items: itemsPayload.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
        })),
        org_name: org.name,
      })

      // Refresh product stock optimistically
      setProducts(prev =>
        prev.map(p => {
          const sold = cartItems.find(i => i.id === p.id)
          if (!sold || !p.track_stock) return p
          return { ...p, stock_current: (p.stock_current ?? 0) - sold.cart_quantity }
        })
      )

      toast.success('¡Venta completada!')
    } catch (err) {
      console.error(err)
      const message = err instanceof Error ? err.message : 'Error al registrar la venta'
      toast.error(message)
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex gap-4 p-4">
      {/* Products area */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-border/60 bg-card relative">
        {!loading && !isOpen && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 text-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>No hay caja abierta.</span>
            <Link href={`/${org.slug}/caja`} className="font-semibold underline">
              Abrir caja →
            </Link>
          </div>
        )}
        <ProductGrid products={products} loading={loading} />
      </div>

      {/* Cart */}
      <div className="w-80">
        <CartSummary
          onCheckout={handleCheckout}
          onHold={handleHoldSale}
          orgSlug={org.slug}
        />
      </div>

      <PaymentModal
        open={paymentOpen}
        total={getTotal()}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handlePayment}
      />

      {ticketData && (
        <SaleTicket
          open={!!ticketData}
          onClose={() => setTicketData(null)}
          sale={ticketData}
        />
      )}
    </div>
  )
}
