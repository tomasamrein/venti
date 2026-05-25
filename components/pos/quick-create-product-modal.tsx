'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Sparkles } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { formatARS } from '@/lib/utils/currency'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface QuickCreateProductModalProps {
  barcode: string | null
  orgId: string
  onClose: () => void
  onCreated: (product: Product) => void
}

export function QuickCreateProductModal({ barcode, orgId, onClose, onCreated }: QuickCreateProductModalProps) {
  const addItem = useCartStore(s => s.addItem)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [looking, setLooking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [foundOff, setFoundOff] = useState(false)

  useEffect(() => {
    if (!barcode) return
    setName(''); setBrand(null); setImageUrl(null); setPrice(''); setStock(''); setFoundOff(false)
    setLooking(true)
    fetch(`/api/products/lookup?barcode=${encodeURIComponent(barcode)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.name) {
          setName(data.name)
          setBrand(data.brand ?? null)
          setImageUrl(data.image_url ?? null)
          setFoundOff(true)
        }
      })
      .catch(() => {})
      .finally(() => setLooking(false))
  }, [barcode])

  const priceNum = parseFloat(price) || 0

  async function handleCreate() {
    if (!name.trim()) { toast.error('Ingresá un nombre'); return }
    if (priceNum <= 0) { toast.error('El precio debe ser mayor a 0'); return }
    setSaving(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('products')
        .insert({
          organization_id: orgId,
          name: name.trim(),
          barcode: barcode,
          brand: brand,
          image_url: imageUrl,
          price_sell: priceNum,
          stock_current: parseFloat(stock) || 0,
          track_stock: true,
          is_active: true,
        })
        .select('*')
        .single()
      if (error) throw error
      addItem(data as Product, 1)
      onCreated(data as Product)
      toast.success('Producto creado y agregado')
      onClose()
    } catch (err: unknown) {
      if ((err as { code?: string })?.code === '23505') {
        toast.error('Ya existe un producto con ese código de barras')
      } else {
        toast.error('No se pudo crear el producto')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!barcode} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-poppins">Producto nuevo</DialogTitle>
          <DialogDescription>
            Código {barcode}{looking ? ' · buscando datos…' : foundOff ? ' · datos de Open Food Facts' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="h-20 w-20 object-contain mx-auto rounded-lg border border-border" />
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              Nombre {foundOff && <Sparkles className="h-3 w-3 text-emerald-500" />}
            </Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del producto" autoFocus={!looking} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Precio de venta *</Label>
              <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Stock inicial</Label>
              <Input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold">{priceNum > 0 ? formatARS(priceNum) : ''}</span>
            <Button onClick={handleCreate} disabled={saving || looking} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Crear y agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
