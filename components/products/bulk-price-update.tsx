'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { TrendingUp, TrendingDown } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface BulkPriceUpdateProps {
  open: boolean
  onClose: () => void
  orgId: string
  onDone: () => void
}

export function BulkPriceUpdate({ open, onClose, orgId, onDone }: BulkPriceUpdateProps) {
  const [field, setField] = useState<'price_sell' | 'price_cost'>('price_sell')
  const [type, setType] = useState<'pct' | 'fixed'>('pct')
  const [value, setValue] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Load categories on open
  const loadCategories = async () => {
    if (!orgId) return
    const supabase = createClient()
    const { data } = await supabase
      .from('product_categories')
      .select('id, name')
      .eq('organization_id', orgId)
      .order('name')
    setCategories(data || [])
  }

  const handleApply = async () => {
    const numVal = parseFloat(value)
    if (!numVal || numVal === 0) {
      toast.error('Ingresá un valor válido')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      let query = supabase.from('products').select('id, price_sell, price_cost').eq('organization_id', orgId)
      if (categoryId !== 'all') query = query.eq('category_id', categoryId)

      const { data: products, error } = await query
      if (error) throw error
      if (!products || products.length === 0) {
        toast.error('No hay productos para actualizar')
        return
      }

      // Compute all new values first
      const updates = products.map(p => {
        const current = field === 'price_sell' ? (p.price_sell || 0) : (p.price_cost || 0)
        let newValue = type === 'pct'
          ? current * (1 + numVal / 100)
          : current + numVal
        newValue = Math.max(0, Math.round(newValue * 100) / 100)
        return { id: p.id, newValue }
      })

      // Batch in chunks of 50 (parallel within each chunk)
      const chunks: typeof updates[] = []
      for (let i = 0; i < updates.length; i += 50) chunks.push(updates.slice(i, i + 50))

      let failed = 0
      for (const chunk of chunks) {
        const results = await Promise.all(
          chunk.map(u =>
            field === 'price_sell'
              ? supabase.from('products').update({ price_sell: u.newValue }).eq('id', u.id)
              : supabase.from('products').update({ price_cost: u.newValue }).eq('id', u.id)
          )
        )
        failed += results.filter(r => r.error).length
      }

      if (failed > 0) toast.error(`${failed} productos no se pudieron actualizar`)
      else toast.success(`${products.length} productos actualizados`)
      onDone()
      onClose()
      setValue('')
    } catch {
      toast.error('Error al actualizar precios')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (v) loadCategories()
        else onClose()
      }}
    >
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Actualización masiva de precios</DialogTitle>
          <DialogDescription>
            Aplicá un ajuste porcentual o fijo a todos los productos o a una categoría.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Campo a actualizar</Label>
            <Select value={field} onValueChange={v => v && setField(v as typeof field)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price_sell">Precio de venta</SelectItem>
                <SelectItem value="price_cost">Precio de costo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-2 block">Categoría (opcional)</Label>
            <Select value={categoryId} onValueChange={v => v && setCategoryId(v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <Label className="mb-2 block">Tipo de ajuste</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('pct')}
                  className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    type === 'pct'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
                      : 'border-border'
                  }`}
                >
                  Porcentaje %
                </button>
                <button
                  type="button"
                  onClick={() => setType('fixed')}
                  className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    type === 'fixed'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
                      : 'border-border'
                  }`}
                >
                  Monto fijo $
                </button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="bulk-value" className="mb-2 block">
              Valor {type === 'pct' ? '(puede ser negativo para bajar)' : '(negativo para bajar)'}
            </Label>
            <div className="relative">
              {value && parseFloat(value) > 0 ? (
                <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              ) : value && parseFloat(value) < 0 ? (
                <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-500" />
              ) : null}
              <Input
                id="bulk-value"
                type="number"
                placeholder={type === 'pct' ? 'Ej: 10 (sube 10%), -5 (baja 5%)' : 'Ej: 500 (suma $500)'}
                value={value}
                onChange={e => setValue(e.target.value)}
                className="rounded-xl h-11 pl-9"
              />
            </div>
          </div>

          {value && (
            <div className={`p-3 rounded-xl text-sm ${
              parseFloat(value) >= 0
                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
            }`}>
              {type === 'pct'
                ? `Los precios ${parseFloat(value) >= 0 ? 'subirán' : 'bajarán'} un ${Math.abs(parseFloat(value))}%`
                : `Se ${parseFloat(value) >= 0 ? 'sumará' : 'restará'} $${Math.abs(parseFloat(value))} a cada precio`
              }
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              onClick={handleApply}
              disabled={submitting || !value}
            >
              {submitting ? 'Actualizando...' : 'Aplicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
