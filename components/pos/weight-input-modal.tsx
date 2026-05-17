'use client'

import { useEffect, useRef, useState } from 'react'
import { Scale } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatARS } from '@/lib/utils/currency'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface Props {
  open: boolean
  product: Product | null
  onClose: () => void
  onConfirm: (product: Product, weightInUnit: number) => void
}

// Common units stored at the product level. `g` is converted to kg for pricing.
function normalizeUnit(unit: string | null | undefined): 'kg' | 'g' {
  const u = (unit ?? '').toLowerCase()
  if (u === 'g' || u === 'gr' || u === 'gramo' || u === 'gramos') return 'g'
  return 'kg'
}

const PRESETS_KG = [0.25, 0.5, 1, 2]
const PRESETS_G = [100, 250, 500, 1000]

export function WeightInputModal({ open, product, onClose, onConfirm }: Props) {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const unit = normalizeUnit(product?.unit)
  const price = product?.price_sell ?? 0
  const presets = unit === 'kg' ? PRESETS_KG : PRESETS_G

  useEffect(() => {
    if (open) {
      setInput('')
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open, product?.id])

  const parsed = Number(input.replace(',', '.'))
  const valid = Number.isFinite(parsed) && parsed > 0
  // Price per kg is the canonical price; if unit is grams, multiply by g/1000.
  const totalAmount = valid ? (unit === 'g' ? (parsed / 1000) * price : parsed * price) : 0

  const submit = () => {
    if (!product || !valid) return
    onConfirm(product, parsed)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <Scale className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <DialogTitle className="text-base">Venta por peso</DialogTitle>
          </div>
          <DialogDescription className="text-[13px]">
            {product?.name} · {formatARS(price)} / {unit === 'g' ? 'kg' : 'kg'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {presets.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setInput(String(p))}
                className="h-10 rounded-lg border border-border bg-muted/30 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950/30 text-[13px] font-semibold text-foreground transition-colors"
              >
                {unit === 'g' ? `${p} g` : `${p} kg`}
              </button>
            ))}
          </div>

          <div className="relative">
            <Input
              ref={inputRef}
              inputMode="decimal"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              placeholder={unit === 'g' ? 'Ej: 350' : 'Ej: 0.500'}
              className="h-14 text-2xl font-bold tabular-nums pr-14 rounded-xl"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground uppercase">
              {unit}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Total</span>
            <span className="text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
              {formatARS(totalAmount)}
            </span>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={onClose} className="rounded-xl">Cancelar</Button>
            <Button
              onClick={submit}
              disabled={!valid}
              className="rounded-xl text-white"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}
            >
              Agregar al carrito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function isWeightUnit(unit: string | null | undefined): boolean {
  const u = (unit ?? '').toLowerCase()
  return u === 'kg' || u === 'g' || u === 'gr' || u === 'kilo' || u === 'kilos' || u === 'gramo' || u === 'gramos'
}
