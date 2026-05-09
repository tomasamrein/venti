'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Clock, ShoppingCart, Grid3X3, Printer, ScanBarcode, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ProductGrid } from '@/components/pos/product-grid'
import { CartSummary } from '@/components/pos/cart-summary'
import { PaymentModal } from '@/components/pos/payment-modal'
import { SaleTicket } from '@/components/pos/sale-ticket'
import { CopyServicePanel } from '@/components/pos/copy-service-panel'
import { EmployeeSwitcher } from '@/components/pos/employee-switcher'
import { UsbScannerInput } from '@/components/pos/usb-scanner-input'
import { RemoteScannerModal } from '@/components/pos/remote-scanner-modal'
import { OfflineBanner } from '@/components/shared/offline-banner'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cart-store'
import { usePosStore } from '@/stores/pos-store'
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner'
import { useOffline } from '@/hooks/use-offline'
import { useOrg } from '@/hooks/use-org'
import { useCashSession } from '@/hooks/use-cash-session'
import { db } from '@/lib/offline/db'
import { queueMutation } from '@/lib/offline/sync'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']
type MobileTab = 'products' | 'services' | 'cart'

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
  const { activeCashierName } = usePosStore()
  const isOffline = useOffline(org.id)

  const businessType = org.business_type
  const isFotocopiadora = !!(org.settings as any)?.copy_service_enabled
  const isDrugstore = businessType === 'drugstore'

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [ticketData, setTicketData] = useState<SaleData | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('products')
  const [usbInputOpen, setUsbInputOpen] = useState(false)
  const [remoteScannerOpen, setRemoteScannerOpen] = useState(false)
  const [remoteScanSessionId] = useState(() => {
    const key = 'remote_scan_session_pos'
    const stored = sessionStorage.getItem(key)
    if (stored) return stored
    const id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
    return id
  })
  const [lastRemoteScan, setLastRemoteScan] = useState<string | null>(null)

  const cartItems = useCartStore(s => s.items)
  const cartDiscount = useCartStore(s => s.discount_pct)
  const customerId = useCartStore(s => s.customer_id)
  const getTotal = useCartStore(s => s.getTotal)
  const getSubtotal = useCartStore(s => s.getSubtotal)
  const clearCart = useCartStore(s => s.clear)
  const addItem = useCartStore(s => s.addItem)

  useEffect(() => {
    if (isOffline) {
      db.products
        .where('organization_id').equals(org.id)
        .filter(p => p.is_active)
        .sortBy('name')
        .then(data => {
          setProducts(data as unknown as Product[])
          setLoading(false)
        })
      return
    }
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
  }, [org.id, isOffline])

  const handleBarcodeFound = useCallback((barcode: string) => {
    const product = products.find(p => p.barcode === barcode)
    if (product) {
      addItem(product, 1)
      toast.success(`${product.name} agregado`)
    } else {
      toast.error(`Código ${barcode} no encontrado`)
    }
  }, [products, addItem])

  useBarcodeScanner(handleBarcodeFound)

  // Remote scanner: Realtime channel stays alive for the full POS session
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`scanner:${remoteScanSessionId}`)
      .on('broadcast', { event: 'scan' }, ({ payload }) => {
        const code = payload.barcode as string
        setLastRemoteScan(code)
        handleBarcodeFound(code)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [remoteScanSessionId, handleBarcodeFound])

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
          id: i.product_id ?? i.id,
          name: i.name,
          price_sell: i.price_sell,
          cart_quantity: i.cart_quantity,
          barcode: i.barcode,
          tax_rate: i.tax_rate,
          is_service: i.is_service,
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
      product_id: item.is_service ? null : item.product_id,
      name: item.name,
      barcode: item.barcode,
      unit_price: item.price_sell,
      quantity: item.cart_quantity,
      discount_pct: item.cart_discount_pct,
      tax_rate: item.tax_rate,
      subtotal: item.price_sell * item.cart_quantity,
    }))

    const saleNotes = isDrugstore && activeCashierName
      ? `[Cajero: ${activeCashierName}]`
      : null

    const rpcArgs = {
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
      p_change_amount: method === 'cash' ? Math.max(0, amountPaid - total) : null,
      p_notes: saleNotes,
      p_items: itemsPayload,
    }

    // Offline: queue the RPC and show a local ticket
    if (isOffline) {
      const key = crypto.randomUUID()
      await queueMutation('__rpc__complete_sale', 'insert', rpcArgs, key)
      setPaymentOpen(false)
      clearCart()
      setTicketData({
        id: key,
        sale_number: null,
        payment_method: method,
        subtotal,
        discount_amount: discountAmount,
        total,
        amount_paid: amountPaid,
        change_amount: method === 'cash' ? Math.max(0, amountPaid - total) : null,
        completed_at: new Date().toISOString(),
        items: itemsPayload.map(i => ({ name: i.name, quantity: i.quantity, unit_price: i.unit_price, subtotal: i.subtotal })),
        org_name: org.name,
      })
      toast.success('Venta guardada offline — se sincronizará al reconectar')
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)('complete_sale', rpcArgs)

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
        change_amount: method === 'cash' ? Math.max(0, amountPaid - total) : null,
        completed_at: new Date().toISOString(),
        items: itemsPayload.map(i => ({
          name: i.name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
        })),
        org_name: org.name,
      })

      setProducts(prev =>
        prev.map(p => {
          const sold = cartItems.find(i => i.product_id === p.id)
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

  const cartCount = cartItems.reduce((s, i) => s + i.cart_quantity, 0)
  const showProductsArea = mobileTab === 'products' || mobileTab === 'services'

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col md:flex-row gap-0 md:gap-4 md:p-4">
      <OfflineBanner />
      {/* Products + services area */}
      <div className={`flex-1 flex flex-col overflow-hidden md:rounded-2xl md:border md:border-border/60 md:bg-card relative ${mobileTab === 'cart' ? 'hidden md:flex' : 'flex'}`}>
        {/* Drugstore: employee switcher in top bar */}
        {isDrugstore && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-card/80 shrink-0">
            <span className="text-xs text-muted-foreground">Cajero:</span>
            <EmployeeSwitcher orgId={org.id} />
            {!activeCashierName && (
              <span className="text-xs text-amber-600 dark:text-amber-400">← Seleccioná un cajero</span>
            )}
          </div>
        )}

        {!loading && !isOpen && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 text-sm px-4 py-2 rounded-full flex items-center gap-2 whitespace-nowrap">
            <Clock className="h-4 w-4 shrink-0" />
            <span>No hay caja abierta.</span>
            <Link href={`/${org.slug}/caja`} className="font-semibold underline">
              Abrir caja →
            </Link>
          </div>
        )}

        {/* Product grid — hidden on mobile when "services" tab is active */}
        <div className={`flex-1 overflow-hidden relative ${isFotocopiadora && mobileTab === 'services' ? 'hidden md:block' : 'block'}`}>
          <ProductGrid products={products} loading={loading} />
          {/* Camera scanner button — mobile: above tab bar; desktop: bottom-left */}
          <div className="absolute bottom-16 md:bottom-3 left-3 flex flex-col gap-2 z-10">
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-md"
              onClick={() => setUsbInputOpen(true)}
              title="Ingresar código manualmente / Escáner USB"
            >
              <ScanBarcode className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="h-10 w-10 rounded-full shadow-md"
              onClick={() => setRemoteScannerOpen(true)}
              title="Escáner remoto (celular)"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Copy services panel — fotocopiadora only */}
        {isFotocopiadora && (
          <div className={`shrink-0 ${mobileTab === 'services' ? 'block' : 'hidden md:block'}`}>
            <CopyServicePanel orgId={org.id} />
          </div>
        )}
      </div>

      {/* Cart */}
      <div className={`md:w-80 md:shrink-0 flex-1 flex flex-col ${mobileTab === 'cart' ? 'flex' : 'hidden md:flex'}`}>
        <CartSummary
          onCheckout={handleCheckout}
          onHold={handleHoldSale}
          orgSlug={org.slug}
          orgId={org.id}
        />
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background border-t border-border flex h-14 shrink-0">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${mobileTab === 'products' ? 'text-emerald-600' : 'text-muted-foreground'}`}
        >
          <Grid3X3 className="h-5 w-5" />
          Productos
        </button>

        {isFotocopiadora && (
          <button
            onClick={() => setMobileTab('services')}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors ${mobileTab === 'services' ? 'text-emerald-600' : 'text-muted-foreground'}`}
          >
            <Printer className="h-5 w-5" />
            Servicios
          </button>
        )}

        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors relative ${mobileTab === 'cart' ? 'text-emerald-600' : 'text-muted-foreground'}`}
        >
          <span className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-emerald-600 text-white text-[10px] font-bold rounded-full h-4 min-w-4 flex items-center justify-center px-0.5">
                {cartCount}
              </span>
            )}
          </span>
          Carrito
        </button>
      </div>

      <div className="md:hidden h-14 shrink-0" />

      <PaymentModal
        open={paymentOpen}
        total={getTotal()}
        hasCustomer={!!customerId}
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

      <UsbScannerInput
        open={usbInputOpen}
        onScan={handleBarcodeFound}
        onClose={() => setUsbInputOpen(false)}
      />

      <RemoteScannerModal
        open={remoteScannerOpen}
        onClose={() => setRemoteScannerOpen(false)}
        sessionId={remoteScanSessionId}
        orgSlug={org.slug}
        lastScan={lastRemoteScan}
      />
    </div>
  )
}
