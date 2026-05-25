'use client'

import { X, Minus, Plus, Trash2, Clock, User, Search, ShoppingCart, Receipt } from 'lucide-react'
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
  checkoutDisabled?: boolean
}

export function CartSummary({ onCheckout, onHold, orgSlug, orgId, checkoutDisabled }: CartSummaryProps) {
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

  const itemCount = items.reduce((s, i) => s + i.cart_quantity, 0)

  return (
    <Card className="h-full flex flex-col border border-border/60 bg-card rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/60 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-900/50 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold leading-none">Carrito</h2>
              <p className="text-[10px] text-muted-foreground mt-1">
                {itemCount === 0 ? 'Vacío' : `${itemCount} ${itemCount === 1 ? 'ítem' : 'ítems'}`}
              </p>
            </div>
          </div>
          {!isEmpty && (
            <Button variant="ghost" size="sm" onClick={() => clear()} className="h-8 px-2 text-destructive hover:bg-destructive/10 text-[11px]">
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Vaciar
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
            <ShoppingCart className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-foreground">Carrito vacío</p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[180px]">
            Tocá un producto o escaneá su código para empezar
          </p>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-3 py-3">
            <div className="space-y-1.5">
              {items.map(item => (
                <div
                  key={item.id}
                  className="group p-2.5 rounded-xl border border-border/40 bg-background/60 hover:border-border hover:bg-background transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold leading-tight line-clamp-2">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                        {formatARS(item.price_sell || 0)} <span className="text-muted-foreground/60">× unidad</span>
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="shrink-0 w-6 h-6 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {/* Quantity controls */}
                    <div className="inline-flex items-center bg-muted/60 rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.cart_quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-l-lg"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <input
                        type="number"
                        value={item.cart_quantity}
                        onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                        className="w-9 h-7 text-center text-[12px] font-bold bg-transparent border-0 outline-none tabular-nums focus:bg-background focus:ring-1 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.cart_quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-r-lg"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <span className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {formatARS((item.price_sell || 0) * item.cart_quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Totals + actions */}
          <div className="border-t border-border/60 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 space-y-3">
            {/* Discount */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-muted-foreground">Descuento</span>
              <div className="relative">
                <Input
                  type="number"
                  value={discount_pct || ''}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  placeholder="0"
                  className="h-7 w-16 text-[12px] text-right pr-5 rounded-lg tabular-nums"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted-foreground pointer-events-none">%</span>
              </div>
            </div>

            {/* Subtotal/discount */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatARS(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600 dark:text-red-400 font-medium">
                  <span>Descuento ({discount_pct}%)</span>
                  <span className="tabular-nums">-{formatARS(discountAmount)}</span>
                </div>
              )}
            </div>

            {/* Big total */}
            <div className="rounded-xl bg-slate-900 dark:bg-slate-800 text-white p-3 flex items-end justify-between border border-slate-800 dark:border-slate-700">
              <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Total a pagar</span>
              <span className="text-2xl font-black tabular-nums leading-none text-white">{formatARS(total)}</span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-1">
              <Button
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] rounded-xl shadow-sm hover:shadow-md hover:shadow-emerald-500/20 transition-all"
                onClick={onCheckout}
                disabled={checkoutDisabled}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Cobrar {formatARS(total)}
                <span className="ml-auto text-[10px] font-mono bg-emerald-700/60 px-1.5 py-0.5 rounded opacity-70">P</span>
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-9 rounded-lg text-[12px] font-semibold"
                  onClick={onHold}
                >
                  Guardar
                </Button>
                {orgSlug && (
                  <Link href={`/${orgSlug}/pos/espera`}>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" title="Ver ventas en espera">
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
