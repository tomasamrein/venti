'use client'

import { X, Minus, Plus, Trash2, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useCartStore } from '@/stores/cart-store'
import { formatARS } from '@/lib/utils/currency'

interface CartSummaryProps {
  onCheckout?: () => void
  onHold?: () => void
  orgSlug?: string
}

export function CartSummary({ onCheckout, onHold, orgSlug }: CartSummaryProps) {
  const items = useCartStore(s => s.items)
  const discount_pct = useCartStore(s => s.discount_pct)
  const updateQuantity = useCartStore(s => s.updateItemQuantity)
  const removeItem = useCartStore(s => s.removeItem)
  const setDiscount = useCartStore(s => s.setDiscount)
  const getSubtotal = useCartStore(s => s.getSubtotal)
  const getTotal = useCartStore(s => s.getTotal)
  const clear = useCartStore(s => s.clear)

  const subtotal = getSubtotal()
  const total = getTotal()
  const discountAmount = subtotal * (discount_pct / 100)
  const isEmpty = items.length === 0

  return (
    <Card className="h-full flex flex-col border border-border/60 bg-gradient-to-br from-card to-card/80 rounded-2xl">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Tu carrito</h2>
        {!isEmpty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clear()}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
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

                  <div className="text-right text-sm font-semibold text-indigo-600 dark:text-indigo-400">
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
              <div className="flex justify-between text-lg font-bold text-indigo-600 dark:text-indigo-400 pt-2 border-t">
                <span>Total</span>
                <span>{formatARS(total)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
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
