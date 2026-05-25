'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { toast } from 'sonner'
import { Search, Loader2, Check, X, Package2, ShoppingCart } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATALOGO_BASE, CATALOGO_CATEGORIES, type CatalogItem } from '@/lib/data/catalogo-base'

interface CatalogResult {
  key: string
  name: string
  brand: string | null
  barcode: string | null
  category: string | null
  unit: string
  image_url: string | null
}

interface Selected extends CatalogResult {
  price: string
}

interface Props {
  open: boolean
  onClose: () => void
  orgId: string
  existingKeys: Set<string>   // nombres (lowercase) y barcodes ya cargados
  onDone: () => void
}

const norm = (s: string) => s.trim().toLowerCase()
const curatedToResult = (c: CatalogItem): CatalogResult => ({
  key: `c:${c.name}`,
  name: c.name,
  brand: c.brand,
  barcode: null,
  category: c.category,
  unit: c.unit,
  image_url: null,
})

export function CatalogImport({ open, onClose, orgId, existingKeys, onDone }: Props) {
  const [query, setQuery] = useState('')
  const [offResults, setOffResults] = useState<CatalogResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Record<string, Selected>>({})
  const [fallbackCategory, setFallbackCategory] = useState<string>(CATALOGO_CATEGORIES[0] ?? 'General')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setQuery(''); setOffResults([]); setSelected({})
    // Carga popular OFF al abrir (sin query)
    fetch('/api/products/catalog-search?q=')
      .then(r => r.json())
      .then(json => {
        const mapped: CatalogResult[] = (json.results ?? []).map((r: {
          barcode: string; name: string; brand: string | null; image_url: string | null
        }) => ({
          key: `o:${r.barcode}`,
          name: r.name,
          brand: r.brand,
          barcode: r.barcode,
          category: null,
          unit: 'un',
          image_url: r.image_url,
        }))
        setOffResults(mapped)
      })
      .catch(() => {})
  }, [open])

  const isExisting = useCallback(
    (r: CatalogResult) =>
      existingKeys.has(norm(r.name)) || (!!r.barcode && existingKeys.has(r.barcode)),
    [existingKeys]
  )

  // Búsqueda Open Food Facts (debounced)
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) { setOffResults([]); setSearching(false); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/catalog-search?q=${encodeURIComponent(q)}`)
        const json = await res.json()
        const mapped: CatalogResult[] = (json.results ?? []).map((r: {
          barcode: string; name: string; brand: string | null; image_url: string | null
        }) => ({
          key: `o:${r.barcode}`,
          name: r.name,
          brand: r.brand,
          barcode: r.barcode,
          category: null,
          unit: 'un',
          image_url: r.image_url,
        }))
        setOffResults(mapped)
      } catch {
        setOffResults([])
      } finally {
        setSearching(false)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [query])

  const curatedResults = useMemo(() => CATALOGO_BASE.map(curatedToResult), [])

  // Resultados a mostrar: con query mezcla curado + OFF; sin query, curado agrupado.
  const filteredCurated = useMemo(() => {
    const q = norm(query)
    if (!q) return curatedResults
    return curatedResults.filter(r =>
      norm(r.name).includes(q) || (r.brand && norm(r.brand).includes(q))
    )
  }, [query, curatedResults])

  const mergedResults = useMemo(() => {
    const curatedNames = new Set(filteredCurated.map(r => norm(r.name)))
    const off = offResults.filter(r => !curatedNames.has(norm(r.name)))
    return [...filteredCurated, ...off].filter(r => !isExisting(r) && !selected[r.key])
  }, [filteredCurated, offResults, isExisting, selected])

  const grouped = useMemo(() => {
    if (query.trim()) return null
    const map = new Map<string, CatalogResult[]>()
    for (const r of mergedResults) {
      const cat = r.category ?? 'Otros'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(r)
    }
    return [...map.entries()]
  }, [mergedResults, query])

  function toggle(r: CatalogResult) {
    setSelected(prev => {
      const next = { ...prev }
      if (next[r.key]) delete next[r.key]
      else next[r.key] = { ...r, price: '' }
      return next
    })
  }

  function setPrice(key: string, price: string) {
    setSelected(prev => ({ ...prev, [key]: { ...prev[key], price } }))
  }

  const selectedList = Object.values(selected)

  async function handleSubmit() {
    if (selectedList.length === 0) return
    setSubmitting(true)
    try {
      const rows = selectedList.map(s => ({
        name: s.name,
        brand: s.brand,
        barcode: s.barcode,
        unit: s.unit,
        category: s.category ?? fallbackCategory,
        price_sell: parseFloat(s.price) || 0,
        track_stock: true,
      }))
      const res = await fetch('/api/products/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: orgId, rows }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al agregar'); return }
      toast.success(`${data.inserted} producto${data.inserted !== 1 ? 's' : ''} agregado${data.inserted !== 1 ? 's' : ''}`)
      onDone()
      onClose()
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  function ResultCard({ r }: { r: CatalogResult }) {
    return (
      <button
        type="button"
        onClick={() => toggle(r)}
        className="text-left rounded-xl border border-border/60 bg-card hover:border-emerald-500 transition-colors overflow-hidden flex items-center gap-2 p-2"
      >
        <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
          {r.image_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
            : <Package2 className="h-5 w-5 text-muted-foreground/40" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium leading-tight line-clamp-2">{r.name}</p>
          {r.brand && <p className="text-[10px] text-muted-foreground">{r.brand}</p>}
        </div>
        {r.barcode && <span className="text-[9px] font-mono text-muted-foreground shrink-0">EAN</span>}
      </button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="flex flex-col gap-0 p-0 overflow-hidden rounded-2xl w-[calc(100%-1rem)] max-w-5xl! h-[88dvh]!">
        <DialogHeader className="px-4 sm:px-5 pt-4 pb-3 border-b border-border shrink-0 pr-12">
          <DialogTitle className="font-poppins">Catálogo de productos</DialogTitle>
          <DialogDescription>
            Buscá y tildá los productos que vendés. Poné el precio y agregalos todos juntos.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Izquierda: buscador + resultados */}
          <div className="flex-1 flex flex-col min-h-0 md:border-r border-border">
            <div className="p-3 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar (ej. coca, alfajor, yerba)…"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="pl-9 rounded-xl"
                  autoFocus
                />
                {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3 space-y-4">
              {mergedResults.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10">
                  <Package2 className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">{query.trim() ? 'Sin resultados' : 'No hay más productos para agregar'}</p>
                </div>
              ) : grouped ? (
                grouped.map(([cat, items]) => (
                  <div key={cat}>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">{cat}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {items.map(r => <ResultCard key={r.key} r={r} />)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {mergedResults.map(r => <ResultCard key={r.key} r={r} />)}
                </div>
              )}
            </div>
          </div>

          {/* Derecha: seleccionados + precios */}
          <div className="shrink-0 flex flex-col min-h-0 bg-muted/20 border-t md:border-t-0 border-border w-full md:w-80 max-h-[45dvh] md:max-h-none">
            <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 shrink-0">
              <ShoppingCart className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold">Seleccionados ({selectedList.length})</span>
            </div>

            {selectedList.length === 0 ? (
              <div className="hidden md:flex flex-1 items-center justify-center text-center text-xs text-muted-foreground px-6">
                Tocá un producto de la izquierda para agregarlo y ponerle precio.
              </div>
            ) : (
              <div className="flex-1 overflow-auto p-3 space-y-2 min-h-0">
                {selectedList.map(s => (
                  <div key={s.key} className="rounded-lg border border-border bg-card p-2">
                    <div className="flex items-start gap-2">
                      <p className="text-[12px] font-medium leading-tight flex-1 line-clamp-2">{s.name}</p>
                      <button onClick={() => toggle(s)} className="text-muted-foreground hover:text-foreground shrink-0">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">$</span>
                      <Input
                        type="number" min="0" step="0.01" inputMode="decimal"
                        placeholder="Precio"
                        value={s.price}
                        onChange={e => setPrice(s.key, e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border p-3 space-y-2 shrink-0">
              <div>
                <p className="text-[11px] text-muted-foreground mb-1">Categoría para los que no tengan</p>
                <Select value={fallbackCategory} onValueChange={v => v && setFallbackCategory(v)}>
                  <SelectTrigger className="h-8 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATALOGO_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={selectedList.length === 0 || submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                Agregar {selectedList.length > 0 ? selectedList.length : ''} producto{selectedList.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
