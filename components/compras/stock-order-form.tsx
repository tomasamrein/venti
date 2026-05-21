'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatARS } from '@/lib/utils/currency'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useOrg } from '@/hooks/use-org'
import { useRouter } from 'next/navigation'

interface Supplier { id: string; name: string }
interface Product { id: string; name: string; price_cost: number | null }

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitCost: number
  subtotal: number
}

interface Props {
  onClose: () => void
}

export function StockOrderForm({ onClose }: Props) {
  const { org, branch } = useOrg()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderItem[]>([{ productId: '', productName: '', quantity: 1, unitCost: 0, subtotal: 0 }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('suppliers').select('id, name').eq('organization_id', org.id).eq('is_active', true).order('name')
      .then(({ data }) => setSuppliers(data ?? []))
    supabase.from('products').select('id, name, price_cost').eq('organization_id', org.id).eq('is_active', true).order('name')
      .then(({ data }) => setProducts(data ?? []))
  }, [org.id])

  function updateItem(idx: number, field: keyof OrderItem, value: string | number) {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const updated = { ...it, [field]: value }
      if (field === 'productId') {
        const prod = products.find(p => p.id === value)
        updated.productName = prod?.name ?? ''
        updated.unitCost = prod?.price_cost ?? 0
      }
      updated.subtotal = Number(updated.quantity) * Number(updated.unitCost)
      return updated
    }))
  }

  function addItem() {
    setItems(prev => [...prev, { productId: '', productName: '', quantity: 1, unitCost: 0, subtotal: 0 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const total = items.reduce((s, i) => s + i.subtotal, 0)

  async function handleSubmit() {
    const validItems = items.filter(i => i.productName.trim() && i.quantity > 0)
    if (!validItems.length) { toast.error('Agregá al menos un ítem'); return }

    setSaving(true)
    const selectedSupplier = suppliers.find(s => s.id === supplierId)

    const res = await fetch('/api/stock-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizationId: org.id,
        branchId: branch.id,
        supplierId: supplierId || undefined,
        supplierName: selectedSupplier?.name || supplierName || undefined,
        notes: notes || undefined,
        items: validItems,
      }),
    })

    if (!res.ok) { toast.error('Error al crear la orden'); setSaving(false); return }
    toast.success('Orden creada')
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-background rounded-2xl border border-border w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[16px] font-bold">Nueva orden de compra</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Proveedor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Proveedor</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px]"
              >
                <option value="">Sin proveedor</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] font-semibold text-muted-foreground mb-1 block">Notas</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Opcional"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-[13px]"
              />
            </div>
          </div>

          {/* Ítems */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-muted-foreground">Ítems</p>
              <button onClick={addItem} className="text-[12px] text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" /> Agregar ítem
              </button>
            </div>

            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 px-1">
                {['Producto', 'Cant.', 'Costo unit.', 'Subtotal', ''].map(h => (
                  <p key={h} className="text-[11px] font-semibold text-muted-foreground">{h}</p>
                ))}
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-2 items-center">
                  <div className="relative">
                    <select
                      value={item.productId}
                      onChange={e => {
                        if (e.target.value === '__manual') {
                          updateItem(idx, 'productId', '')
                          updateItem(idx, 'productName', '')
                        } else {
                          updateItem(idx, 'productId', e.target.value)
                        }
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-border bg-background text-[12px]"
                    >
                      <option value="">Texto libre</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {!item.productId && (
                      <input
                        type="text"
                        value={item.productName}
                        onChange={e => setItems(prev => prev.map((it, i) => i === idx ? { ...it, productName: e.target.value } : it))}
                        placeholder="Nombre del producto"
                        className="mt-1 w-full h-8 px-2 rounded-lg border border-border bg-background text-[12px]"
                      />
                    )}
                  </div>
                  <input
                    type="number" min="0.001" step="any"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="h-8 px-2 rounded-lg border border-border bg-background text-[12px] text-center"
                  />
                  <input
                    type="number" min="0" step="any"
                    value={item.unitCost}
                    onChange={e => updateItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                    className="h-8 px-2 rounded-lg border border-border bg-background text-[12px] text-right"
                  />
                  <p className="text-[12px] font-semibold text-right">{formatARS(item.subtotal)}</p>
                  <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-destructive flex items-center justify-center">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-[11px] text-muted-foreground">Total estimado</p>
            <p className="text-[20px] font-extrabold tracking-tight">{formatARS(total)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving ? 'Guardando…' : 'Crear orden'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
