'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Zap, Loader2, Check } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATALOGO_CATEGORIES } from '@/lib/data/catalogo-base'

interface Props {
  open: boolean
  onClose: () => void
  orgId: string
  onDone: () => void
}

export function QuickAddModal({ open, onClose, orgId, onDone }: Props) {
  const [text, setText] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState(CATALOGO_CATEGORIES[0] ?? 'General')
  const [submitting, setSubmitting] = useState(false)

  const parsed = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => {
      const lastComma = l.lastIndexOf(',')
      if (lastComma !== -1) {
        const maybePrice = l.slice(lastComma + 1).trim()
        const num = parseFloat(maybePrice.replace(/\s/g, ''))
        if (!isNaN(num) && num >= 0) {
          return { name: l.slice(0, lastComma).trim(), price: num }
        }
      }
      return { name: l, price: parseFloat(price) || 0 }
    })
    .filter(r => r.name)

  async function handleSubmit() {
    if (parsed.length === 0) return
    setSubmitting(true)
    try {
      const rows = parsed.map(r => ({
        name: r.name,
        category,
        price_sell: r.price,
        unit: 'un',
        track_stock: true,
      }))
      const res = await fetch('/api/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, rows }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al crear'); return }
      toast.success(`${data.inserted} producto${data.inserted !== 1 ? 's' : ''} creado${data.inserted !== 1 ? 's' : ''}`)
      onDone()
      handleClose()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    setText(''); setPrice('')
    setCategory(CATALOGO_CATEGORIES[0] ?? 'General')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-600" />
            Carga express
          </DialogTitle>
          <DialogDescription>
            Escribí un producto por línea. Podés poner el precio después de una coma.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <textarea
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 placeholder:text-muted-foreground"
            rows={8}
            placeholder={"Coca Cola 2.5L, 1800\nAlfajor Jorgito, 450\nJabón líquido suelto, 760\nYerba Rosamonte 1kg\n..."}
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Precio por defecto (sin no pusiste coma)</p>
              <div className="flex items-center gap-1 border border-border rounded-lg px-2 bg-background h-9">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number" min="0" step="0.01" inputMode="decimal"
                  placeholder="0"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="border-0 p-0 h-full text-sm shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Categoría</p>
              <Select value={category} onValueChange={v => v && setCategory(v)}>
                <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATALOGO_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {parsed.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Se crearán <span className="font-semibold text-foreground">{parsed.length}</span> producto{parsed.length !== 1 ? 's' : ''}.
              {parsed.some(r => r.price === 0) && ' Algunos sin precio — podés editarlos después.'}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={parsed.length === 0 || submitting}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Crear {parsed.length > 0 ? parsed.length : ''} producto{parsed.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
