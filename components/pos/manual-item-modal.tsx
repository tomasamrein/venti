'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCartStore } from '@/stores/cart-store'
import { formatARS } from '@/lib/utils/currency'

interface ManualItemModalProps {
  open: boolean
  orgId: string
  onClose: () => void
}

export function ManualItemModal({ open, orgId, onClose }: ManualItemModalProps) {
  const addServiceItem = useCartStore(s => s.addServiceItem)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('1')

  useEffect(() => {
    if (open) { setName(''); setPrice(''); setQuantity('1') }
  }, [open])

  const priceNum = parseFloat(price) || 0
  const qtyNum = parseInt(quantity) || 1
  const total = priceNum * qtyNum

  function handleAdd() {
    if (!name.trim()) { toast.error('Ingresá un nombre'); return }
    if (qtyNum <= 0) { toast.error('La cantidad debe ser mayor a 0'); return }
    if (priceNum <= 0) { toast.error('El precio debe ser mayor a 0'); return }

    addServiceItem({ name: name.trim(), price_sell: priceNum, quantity: qtyNum, organization_id: orgId })
    toast.success(`${name.trim()} (x${qtyNum}) agregado`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-poppins">Artículo manual</DialogTitle>
          <DialogDescription>Vendé algo sin tenerlo cargado en el catálogo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descripción</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej. Fotocopia, Resma, Servicio…"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Cantidad</Label>
              <Input type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Precio unitario</Label>
              <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd() }} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold">Total: {formatARS(total)}</span>
            <Button onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <Plus className="h-4 w-4 mr-1" /> Agregar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
