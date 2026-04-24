'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShoppingCart, Trash2, Clock, User } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { formatARS } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Database } from '@/types/database'

interface Props {
  params: Promise<{ orgSlug: string }>
}

type PendingSaleRow = Database['public']['Tables']['pending_sales']['Row']

interface CartItemLike {
  id: string
  name: string
  price_sell: number
  cart_quantity: number
  barcode?: string | null
}

export default function EsperaPage({ params }: Props) {
  const router = useRouter()
  const [orgSlug, setOrgSlug] = useState('')
  const [sales, setSales] = useState<PendingSaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const restoreCart = useCartStore(s => s.addItem)
  const clearCart = useCartStore(s => s.clear)

  useEffect(() => {
    params.then(p => setOrgSlug(p.orgSlug))
  }, [params])

  const loadSales = useCallback(async () => {
    if (!orgSlug) return
    const supabase = createClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()
    if (!org) return

    const { data } = await supabase
      .from('pending_sales')
      .select('*')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })

    setSales(data || [])
    setLoading(false)
  }, [orgSlug])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  async function handleRestore(sale: PendingSaleRow) {
    const items = sale.items as unknown as CartItemLike[]
    if (!items || items.length === 0) {
      toast.error('Esta venta no tiene productos')
      return
    }

    clearCart()
    for (const item of items) {
      restoreCart(item as any, item.cart_quantity)
    }

    // Delete from pending
    const supabase = createClient()
    await supabase.from('pending_sales').delete().eq('id', sale.id)

    toast.success(`Venta "${sale.label || 'sin etiqueta'}" restaurada al carrito`)
    router.push(`/${orgSlug}/pos`)
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('pending_sales').delete().eq('id', id)

    if (error) {
      toast.error('Error al eliminar la venta')
    } else {
      toast.success('Venta eliminada')
      setSales(prev => prev.filter(s => s.id !== id))
    }
    setDeleteId(null)
  }

  function getTotal(rawItems: unknown): number {
    const items = rawItems as CartItemLike[]
    return items.reduce((sum, i) => sum + (i.price_sell || 0) * i.cart_quantity, 0)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/${orgSlug}/pos`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver al POS
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Ventas en espera</h1>
          <p className="text-sm text-muted-foreground">
            {sales.length} venta{sales.length !== 1 ? 's' : ''} guardada{sales.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando...</div>
      ) : sales.length === 0 ? (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay ventas en espera</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Usá "Guardar venta" en el POS para pausar una venta y retomarla después.
            </p>
            <Link href={`/${orgSlug}/pos`}>
              <Button>Ir al POS</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sales.map(sale => {
            const items = sale.items as unknown as CartItemLike[]
            const total = getTotal(items)
            return (
              <Card key={sale.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="font-semibold">
                          {sale.label || 'Sin etiqueta'}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(sale.created_at), 'dd/MM HH:mm', { locale: es })}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {items.slice(0, 4).map((item, i) => (
                          <span key={i} className="text-xs bg-muted px-2 py-0.5 rounded-md">
                            {item.cart_quantity}× {item.name}
                          </span>
                        ))}
                        {items.length > 4 && (
                          <span className="text-xs text-muted-foreground">
                            +{items.length - 4} más
                          </span>
                        )}
                      </div>

                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatARS(total)}
                      </p>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => setDeleteId(sale.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRestore(sale)}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        Retomar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar venta en espera?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
