'use client'

import { useState } from 'react'
import { Search, Plus, PackageX, Package2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useCartStore } from '@/stores/cart-store'
import { formatARS } from '@/lib/utils/currency'
import type { Database } from '@/types/database'

interface ProductGridProps {
  products: Database['public']['Tables']['products']['Row'][]
  loading?: boolean
}

export function ProductGrid({ products, loading }: ProductGridProps) {
  const [search, setSearch] = useState('')
  const addItem = useCartStore(s => s.addItem)

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode?.includes(search))
  )

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b border-border/60 bg-card sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto o escanear código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 pr-20 rounded-xl h-11 text-sm border-border/60 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
            autoFocus
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-muted/50 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </div>
        {filtered.length > 0 && !loading && (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}
            {search && ` · "${search}"`}
          </p>
        )}
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border/40 bg-card p-3 space-y-2 animate-pulse">
                <div className="h-24 bg-muted rounded-lg" />
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
              <Package2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Sin resultados</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? `No encontramos productos para "${search}"` : 'Cargá productos para empezar a vender'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(product => {
              const stock = product.stock_current ?? 0
              const trackStock = product.track_stock !== false
              const outOfStock = trackStock && stock <= 0
              const lowStock = trackStock && stock > 0 && stock <= (product.stock_min ?? 0)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addItem(product, 1)}
                  disabled={outOfStock && !product.allow_negative}
                  className="group relative text-left rounded-xl border border-border/60 bg-card hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-100/40 dark:hover:shadow-emerald-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:border-border/60 disabled:hover:shadow-none"
                >
                  {/* Stock badge top-right */}
                  {trackStock && (outOfStock || lowStock) && (
                    <div className="absolute top-2 right-2 z-10">
                      {outOfStock ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-bold shadow-sm">
                          <PackageX className="h-2.5 w-2.5" />Sin stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-bold shadow-sm">
                          {stock} disp.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Image */}
                  <div className="aspect-square bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Package2 className="h-10 w-10 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-2.5 space-y-1">
                    <p className="text-[12px] font-semibold leading-tight line-clamp-2 min-h-[2rem] text-foreground">
                      {product.name}
                    </p>
                    <div className="flex items-end justify-between gap-1">
                      <p className="text-[15px] font-black text-emerald-700 dark:text-emerald-400 tabular-nums leading-none">
                        {formatARS(product.price_sell || 0)}
                      </p>
                      {trackStock && !outOfStock && !lowStock && (
                        <span className="text-[10px] text-muted-foreground tabular-nums leading-none pb-0.5">
                          {stock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add icon on hover */}
                  <div className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-md shadow-emerald-500/30">
                    <Plus className="h-3.5 w-3.5" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
