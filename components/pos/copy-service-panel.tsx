'use client'

import { useState } from 'react'
import { FileText, Palette, BookOpen, Layers, Printer, Plus, Check, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/stores/cart-store'
import { formatARS } from '@/lib/utils/currency'
import { toast } from 'sonner'

interface ServiceDef {
  id: string
  name: string
  defaultPrice: number
  icon: React.ElementType
  colorClass: string
}

const SERVICE_DEFS: ServiceDef[] = [
  { id: 'fotocopia_bn',    name: 'Fotocopia B&N',   defaultPrice: 50,   icon: FileText,  colorClass: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800' },
  { id: 'fotocopia_color', name: 'Fotocopia Color',  defaultPrice: 150,  icon: Palette,   colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950' },
  { id: 'anillado',        name: 'Anillado',          defaultPrice: 800,  icon: BookOpen,  colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950' },
  { id: 'laminado',        name: 'Laminado',          defaultPrice: 500,  icon: Layers,    colorClass: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950' },
  { id: 'impresion',       name: 'Impresión',         defaultPrice: 200,  icon: Printer,   colorClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950' },
]

interface ServiceFormState {
  quantity: string
  price: string
}

interface CopyServicePanelProps {
  orgId: string
  servicePrices?: Record<string, number>
}

export function CopyServicePanel({ orgId, servicePrices = {} }: CopyServicePanelProps) {
  const addServiceItem = useCartStore(s => s.addServiceItem)

  const [expanded, setExpanded] = useState<string | null>(null)
  const [forms, setForms] = useState<Record<string, ServiceFormState>>(() =>
    Object.fromEntries(
      SERVICE_DEFS.map(s => [
        s.id,
        { quantity: '1', price: String(servicePrices[s.id] ?? s.defaultPrice) },
      ])
    )
  )
  const [added, setAdded] = useState<string | null>(null)

  function updateForm(serviceId: string, field: keyof ServiceFormState, value: string) {
    setForms(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], [field]: value } }))
  }

  async function persistPrice(serviceId: string, price: number) {
    try {
      await fetch('/api/org/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, settings: { service_prices: { ...servicePrices, [serviceId]: price } } }),
      })
    } catch {
      // Non-critical: price is still applied in-session
    }
  }

  function handleAdd(service: ServiceDef) {
    const form = forms[service.id]
    const quantity = parseInt(form.quantity) || 1
    const price = parseFloat(form.price) || 0

    if (quantity <= 0) { toast.error('La cantidad debe ser mayor a 0'); return }
    if (price <= 0)    { toast.error('El precio debe ser mayor a 0'); return }

    addServiceItem({ name: service.name, price_sell: price, quantity, organization_id: orgId })

    // Persist price if it changed from the stored value
    const storedPrice = servicePrices[service.id] ?? service.defaultPrice
    if (price !== storedPrice) persistPrice(service.id, price)

    toast.success(`${service.name} (x${quantity}) agregado`)
    setAdded(service.id)
    setTimeout(() => setAdded(null), 1200)
    updateForm(service.id, 'quantity', '1')
    setExpanded(null)
  }

  return (
    <div className="border-t border-border/60 bg-card">
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <Printer className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Servicios de imprenta</span>
      </div>
      <div className="px-3 pb-3 grid grid-cols-5 gap-1.5">
        {SERVICE_DEFS.map(service => {
          const Icon = service.icon
          const form = forms[service.id]
          const isExpanded = expanded === service.id
          const isAdded = added === service.id
          const price = parseFloat(form.price) || 0
          const quantity = parseInt(form.quantity) || 1

          return (
            <div key={service.id} className="col-span-1">
              {!isExpanded ? (
                <button
                  onClick={() => setExpanded(service.id)}
                  className={`
                    w-full flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all duration-150 text-center
                    ${isAdded
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                      : 'border-border/60 hover:border-border bg-background hover:bg-muted/40'}
                  `}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${service.colorClass}`}>
                    {isAdded
                      ? <Check className="h-4 w-4 text-emerald-600" />
                      : <Icon className="h-4 w-4" />
                    }
                  </div>
                  <span className="text-[10px] font-medium leading-tight text-foreground/80 line-clamp-2">{service.name}</span>
                  <span className="text-[10px] text-muted-foreground">{formatARS(price)}</span>
                </button>
              ) : (
                // Expanded: show quantity + price input inline
                // Span across 3 cols for the expanded state (use col-span trick via absolute/relative — simpler: just show a popover-like card)
                // Actually, for a clean grid, we'll render the expanded form in the full row below
                <button
                  onClick={() => setExpanded(null)}
                  className="w-full flex flex-col items-center gap-1 py-2 px-1 rounded-xl border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 text-center"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${service.colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight text-foreground/80 line-clamp-2">{service.name}</span>
                  <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )
        })}

        {/* Expanded form — shown as full-width row when a service is selected */}
        {expanded && (() => {
          const service = SERVICE_DEFS.find(s => s.id === expanded)!
          const form = forms[service.id]
          const price = parseFloat(form.price) || 0
          const quantity = parseInt(form.quantity) || 1
          const total = price * quantity

          return (
            <div className="col-span-5 mt-1 p-3 rounded-xl border border-border bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">{service.name}</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Cantidad</label>
                  <Input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={e => updateForm(service.id, 'quantity', e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    Precio u.
                    <span className="ml-1 text-muted-foreground/60 font-normal">(editable)</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => updateForm(service.id, 'price', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Total: {formatARS(total)}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setExpanded(null)} className="h-8 text-xs">
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(service)}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Agregar
                  </Button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
