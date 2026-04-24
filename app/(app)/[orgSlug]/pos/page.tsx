'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { ProductGrid } from '@/components/pos/product-grid'
import { CartSummary } from '@/components/pos/cart-summary'
import { PaymentModal } from '@/components/pos/payment-modal'
import { SaleTicket } from '@/components/pos/sale-ticket'
import { useCartStore } from '@/stores/cart-store'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
import type { Database } from '@/types/database'

interface Props {
  params: Promise<{ orgSlug: string }>
}

interface OrgData {
  id: string
  name: string
  address: string | null
  phone: string | null
}

interface CashSession {
  id: string
  branch_id: string
}

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

export default function POSPage({ params }: Props) {
  const [orgSlug, setOrgSlug] = useState('')
  const [org, setOrg] = useState<OrgData | null>(null)
  const [session, setSession] = useState<CashSession | null>(null)
  const [products, setProducts] = useState<Database['public']['Tables']['products']['Row'][]>([])
  const [loading, setLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [ticketData, setTicketData] = useState<SaleData | null>(null)

  const cartItems = useCartStore(s => s.items)
  const cartDiscount = useCartStore(s => s.discount_pct)
  const getTotal = useCartStore(s => s.getTotal)
  const getSubtotal = useCartStore(s => s.getSubtotal)
  const clearCart = useCartStore(s => s.clear)
  const addItem = useCartStore(s => s.addItem)

  useEffect(() => {
    params.then(p => setOrgSlug(p.orgSlug))
  }, [params])

  const loadData = useCallback(async () => {
    if (!orgSlug) return
    const supabase = createClient()

    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, address, phone')
      .eq('slug', orgSlug)
      .single()

    if (!orgData) return
    setOrg(orgData)

    const { data: sessionData } = await supabase
      .from('cash_sessions')
      .select('id, branch_id')
      .eq('organization_id', orgData.id)
      .eq('status', 'open')
      .limit(1)
      .maybeSingle()

    setSession(sessionData)

    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', orgData.id)
      .eq('is_active', true)
      .order('name')

    setProducts(productsData || [])
    setLoading(false)
  }, [orgSlug])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    if (!session) {
      toast.error('No hay caja abierta. Abrí la caja primero.')
      return
    }
    setPaymentOpen(true)
  }

  const handleHoldSale = async () => {
    if (cartItems.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    if (!org || !session) {
      toast.error('No hay caja abierta')
      return
    }

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No auth')

      const label = `Venta ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`

      await supabase.from('pending_sales').insert({
        organization_id: org.id,
        branch_id: session.branch_id,
        session_id: session.id,
        label,
        items: cartItems.map(i => ({
          id: i.id,
          name: i.name,
          price_sell: i.price_sell,
          cart_quantity: i.cart_quantity,
          barcode: i.barcode,
          tax_rate: i.tax_rate,
        })),
        created_by: user.id,
      })

      clearCart()
      toast.success(`Venta guardada como "${label}"`)
    } catch {
      toast.error('Error al guardar venta')
    }
  }

  const handlePayment = async (method: string, amount: number) => {
    if (!org || !session) return

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No auth')

      const subtotal = getSubtotal()
      const total = getTotal()
      const discountAmount = subtotal * (cartDiscount / 100)

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          organization_id: org.id,
          branch_id: session.branch_id,
          session_id: session.id,
          sold_by: user.id,
          status: 'completed' as const,
          payment_method: method as any,
          subtotal,
          discount_pct: cartDiscount,
          discount_amount: discountAmount,
          tax_amount: 0,
          total,
          amount_paid: amount,
          change_amount: method === 'cash' ? amount - total : 0,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (saleError) throw saleError

      // Add items
      const saleItems = cartItems.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        organization_id: org.id,
        name: item.name,
        barcode: item.barcode,
        unit_price: item.price_sell || 0,
        quantity: item.cart_quantity,
        tax_rate: item.tax_rate || 21,
        subtotal: (item.price_sell || 0) * item.cart_quantity,
      }))

      const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
      if (itemsError) throw itemsError

      // Deduct stock
      for (const item of cartItems) {
        if (item.track_stock) {
          const newStock = item.allow_negative
            ? (item.stock_current || 0) - item.cart_quantity
            : Math.max(0, (item.stock_current || 0) - item.cart_quantity)
          await supabase.from('products')
            .update({ stock_current: newStock })
            .eq('id', item.id)
        }
      }

      // Register cash movement
      if (method === 'cash' || method === 'debit' || method === 'credit' || method === 'transfer') {
        await supabase.from('cash_movements').insert({
          session_id: session.id,
          organization_id: org.id,
          branch_id: session.branch_id,
          type: 'sale',
          amount: total,
          description: `Venta #${sale.sale_number ?? sale.id.slice(0, 8)}`,
          reference_id: sale.id,
          reference_type: 'sales',
          created_by: user.id,
        })
      }

      setPaymentOpen(false)
      clearCart()

      // Show ticket
      setTicketData({
        id: sale.id,
        sale_number: sale.sale_number,
        payment_method: method,
        subtotal,
        discount_amount: discountAmount,
        total,
        amount_paid: amount,
        change_amount: method === 'cash' ? amount - total : null,
        completed_at: sale.completed_at,
        items: saleItems.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
        })),
        org_name: org.name,
        org_address: org.address ?? undefined,
        org_phone: org.phone ?? undefined,
      })

      toast.success('¡Venta completada!')
    } catch (err) {
      console.error(err)
      toast.error('Error al registrar la venta')
    }
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex gap-4 p-4 bg-gradient-to-br from-background to-background/80">
      {/* Main area */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden border border-border/60 bg-card relative">
        {/* No session warning */}
        {!loading && !session && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 text-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>No hay caja abierta.</span>
            <Link href={`/${orgSlug}/caja`} className="font-semibold underline">
              Abrir caja →
            </Link>
          </div>
        )}
        <ProductGrid products={products} loading={loading} />
      </div>

      {/* Cart sidebar */}
      <div className="w-80">
        <CartSummary
          onCheckout={handleCheckout}
          onHold={handleHoldSale}
          orgSlug={orgSlug}
        />
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentOpen}
        total={getTotal()}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handlePayment}
      />

      {/* Ticket */}
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
