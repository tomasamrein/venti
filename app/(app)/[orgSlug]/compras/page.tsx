'use client'

import { useState, useEffect } from 'react'
import { ShoppingBag, RefreshCw, Phone, Mail, AlertTriangle, CheckCircle2, ExternalLink, PackageCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatARS, waEncode } from '@/lib/utils/currency'
import { useOrg } from '@/hooks/use-org'

interface Suggestion {
  id: string
  name: string
  barcode: string | null
  sku: string | null
  brand: string | null
  unit: string
  stock_current: number
  stock_min: number
  stock_max: number | null
  price_cost: number | null
  suggested_qty: number
  supplier: { name: string; phone: string | null; email: string | null } | null
}

export default function ComprasPage() {
  const { org } = useOrg()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [ordered, setOrdered] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/products/suggested-purchases?org_id=${org.id}`)
    const data = await res.json()
    setSuggestions(data.suggestions || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [org.id])

  function toggleSelect(id: string) {
    if (ordered.has(id)) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function markAsOrdered(ids: Set<string>) {
    setOrdered(prev => new Set([...prev, ...ids]))
    setSelected(new Set())
  }

  function shareWhatsApp(supplier: string | null, items: Suggestion[]) {
    const date = new Date().toLocaleDateString('es-AR')
    const lines = items.map(i =>
      `• ${i.name}${i.brand ? ` (${i.brand})` : ''} — ${i.suggested_qty} ${i.unit}${i.price_cost ? ` @ ${formatARS(i.price_cost)}` : ''}`
    ).join('\n')
    const text = `Pedido ${date}${supplier ? ` para ${supplier}` : ''}:\n\n${lines}`
    window.open(`https://wa.me/?text=${waEncode(text)}`, '_blank')
  }

  const pending = suggestions.filter(s => !ordered.has(s.id))
  const totalEstimated = pending.reduce((sum, s) => sum + (s.price_cost ?? 0) * s.suggested_qty, 0)

  // Group by supplier (all non-ordered items)
  const bySupplier = pending.reduce<Record<string, Suggestion[]>>((acc, s) => {
    const key = s.supplier?.name ?? 'Sin proveedor'
    acc[key] = [...(acc[key] || []), s]
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-6 w-6 text-emerald-600" />
            Lista de compras sugerida
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Productos con stock por debajo del mínimo
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {!loading && suggestions.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-lg font-semibold">¡Stock al día!</p>
          <p className="text-sm text-muted-foreground">Todos los productos tienen stock por encima del mínimo.</p>
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {pending.length} producto{pending.length !== 1 ? 's' : ''} para reponer
                {ordered.size > 0 && <span className="text-amber-600 dark:text-amber-400"> · {ordered.size} ya pedido{ordered.size !== 1 ? 's' : ''}</span>}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => markAsOrdered(selected)}
                >
                  <PackageCheck className="h-3.5 w-3.5" />
                  Marcar como pedido ({selected.size})
                </Button>
              )}
              {totalEstimated > 0 && (
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Estimado: {formatARS(totalEstimated)}
                </span>
              )}
            </div>
          </div>

          {/* Grouped by supplier */}
          {Object.entries(bySupplier).map(([supplierName, items]) => {
            const supplier = items[0].supplier
            return (
              <div key={supplierName} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Supplier header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{supplierName}</p>
                    {supplier && (
                      <div className="flex items-center gap-3 mt-0.5">
                        {supplier.phone && (
                          <a href={`tel:${supplier.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <Phone className="h-3 w-3" />{supplier.phone}
                          </a>
                        )}
                        {supplier.email && (
                          <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <Mail className="h-3 w-3" />{supplier.email}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => shareWhatsApp(supplier?.name ?? null, items.filter(i => !selected.has(i.id)))}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Compartir por WhatsApp
                  </Button>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {items.map(s => (
                    <div
                      key={s.id}
                      className={`flex items-center gap-4 px-4 py-3 transition-colors ${selected.has(s.id) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="h-4 w-4 rounded border-border accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {s.brand && <span className="text-xs text-muted-foreground">{s.brand}</span>}
                          {s.barcode && <span className="text-xs font-mono text-muted-foreground">{s.barcode}</span>}
                        </div>
                      </div>
                      <div className="text-right space-y-0.5">
                        <div className="flex items-center gap-2 justify-end">
                          <Badge
                            variant={s.stock_current <= 0 ? 'destructive' : 'outline'}
                            className="text-xs"
                          >
                            {s.stock_current <= 0 ? 'Sin stock' : `Stock: ${s.stock_current}`}
                          </Badge>
                          <span className="text-sm font-semibold text-emerald-600">
                            Pedir: {s.suggested_qty} {s.unit}
                          </span>
                        </div>
                        {s.price_cost && (
                          <p className="text-xs text-muted-foreground">
                            {formatARS(s.price_cost)} c/u · Total: {formatARS(s.price_cost * s.suggested_qty)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

        </>
      )}
    </div>
  )
}
