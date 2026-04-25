'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { formatARS } from '@/lib/utils/currency'
import type { InvoiceRequest, InvoiceLineItem, InvoiceType } from '@/types/arca'

interface Props {
  orgId: string
  orgSlug: string
  saleId?: string
  onClose: () => void
  onDone: () => void
}

const INVOICE_TYPES: { value: InvoiceType; label: string }[] = [
  { value: 'B', label: 'Factura B (consumidor final)' },
  { value: 'A', label: 'Factura A (responsable inscripto)' },
  { value: 'C', label: 'Factura C (monotributista)' },
  { value: 'ticket', label: 'Ticket no fiscal' },
]

const TAX_RATES = [0, 10.5, 21, 27]

const emptyItem = (): InvoiceLineItem => ({
  description: '',
  quantity: 1,
  unit_price: 0,
  discount_pct: 0,
  tax_rate: 21,
  subtotal: 0,
})

export function InvoiceForm({ orgId, orgSlug, saleId, onClose, onDone }: Props) {
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('B')
  const [customerName, setCustomerName] = useState('')
  const [customerCuit, setCustomerCuit] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [items, setItems] = useState<InvoiceLineItem[]>([emptyItem()])
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [branchId, setBranchId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('branches')
      .select('id, name')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .then(({ data }) => {
        if (data?.length) { setBranches(data); setBranchId(data[0].id) }
      })
  }, [orgId])

  function updateItem(index: number, field: keyof InvoiceLineItem, value: number | string) {
    setItems(prev => {
      const updated = [...prev]
      const item = { ...updated[index], [field]: value }
      const base = item.unit_price * item.quantity * (1 - item.discount_pct / 100)
      item.subtotal = Math.round(base * 100) / 100
      updated[index] = item
      return updated
    })
  }

  const subtotal = items.reduce((s, i) => s + i.subtotal, 0)
  const taxAmount = items.reduce((s, i) => {
    const net = i.subtotal / (1 + i.tax_rate / 100)
    return s + (i.subtotal - net)
  }, 0)
  const total = subtotal

  async function handleSubmit() {
    if (!branchId) { toast.error('Seleccioná una sucursal'); return }
    if (items.some(i => !i.description.trim())) { toast.error('Completá la descripción de todos los ítems'); return }
    if (invoiceType === 'A' && !customerCuit) { toast.error('La factura A requiere CUIT del cliente'); return }

    const req: InvoiceRequest = {
      org_id: orgId,
      branch_id: branchId,
      sale_id: saleId,
      invoice_type: invoiceType,
      customer_name: customerName || undefined,
      customer_cuit: customerCuit || undefined,
      customer_address: customerAddress || undefined,
      items,
      subtotal: Math.round((subtotal / (1 + 0.21)) * 100) / 100, // neto
      tax_amount: Math.round(taxAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/arca/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error al emitir la factura'); return }

      const inv = json.invoice
      toast.success(
        invoiceType === 'ticket' || invoiceType === 'non_fiscal'
          ? 'Ticket registrado'
          : `Factura emitida — CAE ${inv.cae}`
      )
      onDone()
    } catch {
      toast.error('Error de red')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva factura</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Type + Branch */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-1.5 block">Tipo de comprobante</Label>
              <Select value={invoiceType} onValueChange={v => setInvoiceType(v as InvoiceType)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {branches.length > 1 && (
              <div>
                <Label className="mb-1.5 block">Sucursal</Label>
                <Select value={branchId} onValueChange={v => setBranchId(v ?? '')}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Customer */}
          <div className="rounded-xl border p-4 space-y-3">
            <p className="text-sm font-medium">Datos del cliente</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label className="mb-1 block text-xs">Nombre / Razón social</Label>
                <Input
                  placeholder="Consumidor final"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">
                  {invoiceType === 'A' ? 'CUIT *' : 'CUIT / DNI'}
                </Label>
                <Input
                  placeholder="20-12345678-9"
                  value={customerCuit}
                  onChange={e => setCustomerCuit(e.target.value)}
                  className="rounded-xl h-9 font-mono"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-1 block text-xs">Domicilio</Label>
                <Input
                  placeholder="Dirección (opcional)"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Ítems</p>
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  {i === 0 && <Label className="mb-1 block text-xs">Descripción</Label>}
                  <Input
                    placeholder="Producto o servicio"
                    value={item.description}
                    onChange={e => updateItem(i, 'description', e.target.value)}
                    className="rounded-xl h-9"
                  />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label className="mb-1 block text-xs">Cantidad</Label>}
                  <Input
                    type="number"
                    min={0.001}
                    step={0.001}
                    value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', parseFloat(e.target.value) || 0)}
                    className="rounded-xl h-9"
                  />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label className="mb-1 block text-xs">P. unit.</Label>}
                  <Input
                    type="number"
                    min={0}
                    value={item.unit_price}
                    onChange={e => updateItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                    className="rounded-xl h-9"
                  />
                </div>
                <div className="col-span-2">
                  {i === 0 && <Label className="mb-1 block text-xs">IVA %</Label>}
                  <Select
                    value={String(item.tax_rate)}
                    onValueChange={v => updateItem(i, 'tax_rate', parseFloat(v ?? '21'))}
                  >
                    <SelectTrigger className="rounded-xl h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAX_RATES.map(r => (
                        <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  {i === 0 && <div className="mb-1 h-4" />}
                  <div className="h-9 flex items-center justify-end pr-1 text-sm font-medium">
                    {formatARS(item.subtotal)}
                  </div>
                </div>
                <div className="col-span-1">
                  {i === 0 && <div className="mb-1 h-4" />}
                  {items.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive"
                      onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl"
              onClick={() => setItems(prev => [...prev, emptyItem()])}
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar ítem
            </Button>
          </div>

          {/* Totals */}
          <div className="rounded-xl bg-muted/30 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatARS(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA</span>
              <span>{formatARS(taxAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1.5 mt-1">
              <span>Total</span>
              <span>{formatARS(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Emitiendo...</>
              ) : (
                invoiceType === 'ticket' || invoiceType === 'non_fiscal'
                  ? 'Registrar ticket'
                  : 'Emitir factura'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
