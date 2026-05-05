'use client'

import { X, Minus, Plus, Trash2, Clock, User, Search } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCartStore } from '@/stores/cart-store'
import { formatARS } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'

interface CartSummaryProps {
  onCheckout?: () => void
  onHold?: () => void
  orgSlug?: string
  orgId?: string
}

export function CartSummary({ onCheckout, onHold, orgSlug, orgId }: CartSummaryProps) {
  const items = useCartStore(s => s.items)
  const discount_pct = useCartStore(s => s.discount_pct)
  const customerId = useCartStore(s => s.customer_id)
  const updateQuantity = useCartStore(s => s.updateItemQuantity)
  const removeItem = useCartStore(s => s.removeItem)
  const setDiscount = useCartStore(s => s.setDiscount)
  const setCustomer = useCartStore(s => s.setCustomer)
  const getSubtotal = useCartStore(s => s.getSubtotal)
  const getTotal = useCartStore(s => s.getTotal)
  const clear = useCartStore(s => s.clear)

  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<{ id: string; full_name: string; has_account: boolean }[]>([])
  const [customerName, setCustomerName] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!customerSearch.trim() || !orgId) { setCustomerResults([]); return }
    const supabase = createClient()
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('customers')
        .select('id, full_name, has_account')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .ilike('full_name', `%${customerSearch}%`)
        .limit(6)
      setCustomerResults(data ?? [])
    }, 200)
    return () => clearTimeout(timer)
  }, [customerSearch, orgId])

  function selectCustomer(c: { id: string; full_name: string }) {
    setCustomer(c.id)
    setCustomerName(c.full_name)
    setCustomerSearch('')
    setCustomerResults([])
    setShowSearch(false)
  }

  function clearCustomer() {
    setCustomer(null)
    setCustomerName(null)
  }

  const subtotal = getSubtotal()
  const total = getTotal()
  const discountAmount = subtotal * (discount_pct / 100)
  const isEmpty = items.length === 0

  return (
    <Card className="h-full flex flex-col border border-border/60 bg-gradient-to-br from-card to-card/80 rounded-2xl">
      {/* Header */}
      <div className="p-4 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Tu carrito</h2>
          {!isEmpty && (
            <Button variant="ghost" size="sm" onClick={() => clear()} className="text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* Customer selector */}
        <div ref={searchRef} className="relative">
          {customerId && customerName ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[12px]">
              <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="flex-1 font-medium text-emerald-800 truncate">{customerName}</span>
              <button onClick={clearCustomer} className="text-emerald-500 hover:text-emerald-700"><X className="h-3 w-3" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-border cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
              onClick={() => setShowSearch(true)}>
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[12px] text-muted-foreground">Agregar cliente</span>
            </div>
          )}
          {showSearch && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-border bg-white shadow-lg">
              <div className="flex items-center gap-2 px-2.5 py-2 border-b">
                <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input autoFocus value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Buscar cliente..." className="flex-1 text-[13px] outline-none bg-transparent" />
              </div>
              {customerResults.length > 0 && (
                <div className="py-1">
                  {customerResults.map(c => (
                    <button key={c.id} onClick={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2 text-[13px] hover:bg-muted/50 flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="flex-1 truncate">{c.full_name}</span>
                      {c.has_account && <span className="text-[10px] text-emerald-600 font-medium">Cta. cte.</span>}
                    </button>
                  ))}
                </div>
              )}
              {customerSearch && customerResults.length === 0 && (
                <p className="px-3 py-2 text-[12px] text-muted-foreground">Sin resultados</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Carrito vacío
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {items.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-border/40 bg-background/50 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatARS(item.price_sell || 0)} c/u
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.cart_quantity - 1)}
                      className="h-7 w-7 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      value={item.cart_quantity}
                      onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="h-7 text-center text-sm flex-1 rounded-lg"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.cart_quantity + 1)}
                      className="h-7 w-7 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="text-right text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatARS((item.price_sell || 0) * item.cart_quantity)}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Discount */}
          <div className="border-t p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Descuento %</span>
              <Input
                type="number"
                value={discount_pct}
                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                className="h-8 text-sm flex-1"
              />
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm py-2 border-t">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatARS(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Descuento</span>
                  <span>-{formatARS(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-emerald-700 dark:text-emerald-400 pt-2 border-t">
                <span>Total</span>
                <span>{formatARS(total)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                onClick={onCheckout}
              >
                Cobrar
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 rounded-xl"
                  onClick={onHold}
                >
                  Guardar
                </Button>
                {orgSlug && (
                  <Link href={`/${orgSlug}/pos/espera`}>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" title="Ver ventas en espera">
                      <Clock className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
