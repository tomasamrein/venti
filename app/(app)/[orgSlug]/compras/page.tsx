'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShoppingBag, RefreshCw, Phone, Mail, AlertTriangle, CheckCircle2,
  ExternalLink, PackageCheck, History, ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatARS, waEncode } from '@/lib/utils/currency'
import { useOrg } from '@/hooks/use-org'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

interface HistoryItem {
  id: string
  product_name: string
  supplier_name: string | null
  quantity: number
  unit: string
  price_cost: number | null
  ordered_at: string
}

export default function ComprasPage() {
  const { org, userId } = useOrg()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [marking, setMarking] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const loadSuggestions = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/products/suggested-purchases?org_id=${org.id}`)
    const data = await res.json()
    setSuggestions(data.suggestions || [])
    setLoading(false)
  }, [org.id])

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('purchase_order_items')
      .select('id, product_name, supplier_name, quantity, unit, price_cost, ordered_at')
      .eq('organization_id', org.id)
      .order('ordered_at', { ascending: false })
      .limit(100)
    setHistory(data || [])
    setLoadingHistory(false)
  }, [org.id])

  useEffect(() => { loadSuggestions() }, [loadSuggestions])

  useEffect(() => {
    if (showHistory) loadHistory()
  }, [showHistory, loadHistory])

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === suggestions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(suggestions.map(s => s.id)))
    }
  }

  async function markAsOrdered() {
    if (selected.size === 0) return
    setMarking(true)
    try {
      const supabase = createClient()
      const items = suggestions.filter(s => selected.has(s.id))
      const rows = items.map(s => ({
        organization_id: org.id,
        product_id: s.id,
        product_name: s.name,
        supplier_name: s.supplier?.name ?? null,
        quantity: s.suggested_qty,
        unit: s.unit,
        price_cost: s.price_cost,
        ordered_by: userId,
      }))
      const { error } = await supabase.from('purchase_order_items').insert(rows)
      if (error) throw error
      toast.success(`${items.length} producto${items.length !== 1 ? 's' : ''} marcado${items.length !== 1 ? 's' : ''} como pedido`)
      setSuggestions(prev => prev.filter(s => !selected.has(s.id)))
      setSelected(new Set())
      if (showHistory) loadHistory()
    } catch {
      toast.error('Error al guardar el pedido')
    } finally {
      setMarking(false)
    }
  }

  function shareWhatsApp(supplier: string | null, items: Suggestion[]) {
    const date = new Date().toLocaleDateString('es-AR')
    const lines = items.map(i =>
      `• ${i.name}${i.brand ? ` (${i.brand})` : ''} — ${i.suggested_qty} ${i.unit}${i.price_cost ? ` @ ${formatARS(i.price_cost)}` : ''}`
    ).join('\n')
    const text = `Pedido ${date}${supplier ? ` para ${supplier}` : ''}:\n\n${lines}`
    window.open(`https://wa.me/?text=${waEncode(text)}`, '_blank')
  }

  const totalEstimated = suggestions.reduce((sum, s) => sum + (s.price_cost ?? 0) * s.suggested_qty, 0)

  const bySupplier = suggestions.reduce<Record<string, Suggestion[]>>((acc, s) => {
    const key = s.supplier?.name ?? 'Sin proveedor'
    acc[key] = [...(acc[key] || []), s]
    return acc
  }, {})

  const historyByDate = history.reduce<Record<string, HistoryItem[]>>((acc, h) => {
    const date = new Date(h.ordered_at).toLocaleDateString('es-AR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
    acc[date] = [...(acc[date] || []), h]
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
            Productos con stock bajo (umbral: 5 unidades o mínimo configurado)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadSuggestions} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Suggestions */}
      {!loading && suggestions.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center gap-3">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <p className="text-lg font-semibold">¡Stock al día!</p>
          <p className="text-sm text-muted-foreground">Todos los productos tienen más de 5 unidades en stock.</p>
        </div>
      )}

      {!loading && suggestions.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-sm font-semibold">
                {suggestions.length} producto{suggestions.length !== 1 ? 's' : ''} para reponer
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-xs underline underline-offset-2 text-amber-700 dark:text-amber-400 hover:opacity-80"
              >
                {selected.size === suggestions.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              {selected.size > 0 && (
                <Button
                  size="sm"
                  className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={markAsOrdered}
                  disabled={marking}
                >
                  <PackageCheck className="h-3.5 w-3.5" />
                  {marking ? 'Guardando…' : `Marcar como pedido (${selected.size})`}
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
            const selectedItems = items.filter(i => selected.has(i.id))
            return (
              <div key={supplierName} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                  <div>
                    <p className="text-sm font-semibold">{supplierName}</p>
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
                    variant="outline" size="sm" className="gap-1.5 text-xs"
                    onClick={() => shareWhatsApp(supplier?.name ?? null, selectedItems.length > 0 ? selectedItems : items)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Compartir por WhatsApp
                  </Button>
                </div>

                <div className="divide-y divide-border">
                  {items.map(s => (
                    <div
                      key={s.id}
                      onClick={() => toggleSelect(s.id)}
                      className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${
                        selected.has(s.id)
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        onClick={e => e.stopPropagation()}
                        className="h-4 w-4 rounded border-border accent-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
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
                          <span className="text-xs text-muted-foreground">
                            mín: {s.stock_min > 0 ? s.stock_min : 5}
                          </span>
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

      {/* History */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowHistory(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Historial de pedidos</span>
          </div>
          {showHistory ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showHistory && (
          <div className="border-t border-border">
            {loadingHistory && (
              <div className="py-8 text-center text-sm text-muted-foreground">Cargando historial…</div>
            )}
            {!loadingHistory && history.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">No hay pedidos registrados aún.</div>
            )}
            {!loadingHistory && Object.entries(historyByDate).map(([date, items]) => (
              <div key={date}>
                <div className="px-4 py-2 bg-muted/40 border-b border-border">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground capitalize">{date}</p>
                </div>
                <div className="divide-y divide-border/60">
                  {items.map(h => (
                    <div key={h.id} className="flex items-center gap-4 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{h.product_name}</p>
                        {h.supplier_name && (
                          <p className="text-xs text-muted-foreground mt-0.5">{h.supplier_name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">
                          {h.quantity} {h.unit}
                        </p>
                        {h.price_cost && (
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatARS(h.price_cost * h.quantity)}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums w-16 text-right shrink-0">
                        {new Date(h.ordered_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
