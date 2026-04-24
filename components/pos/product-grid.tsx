'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
      <div className="p-4 border-b bg-card sticky top-0 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar producto o código..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl h-11"
            autoFocus
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              Cargando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No hay productos
            </div>
          ) : (
            filtered.map(product => (
              <Card
                key={product.id}
                className="p-3 cursor-pointer hover:border-indigo-400 transition-all border border-border/60 bg-gradient-to-br from-card to-card/80"
              >
                <div
                  onClick={() => addItem(product, 1)}
                  className="space-y-2"
                >
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded-lg bg-muted"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <div className="flex items-end justify-between pt-2 border-t">
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                      {formatARS(product.price_sell || 0)}
                    </p>
                    <span className="text-xs text-muted-foreground">Stock: {product.stock_current}</span>
                  </div>
                  <Button
                    size="sm"
                    className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700"
                    onClick={e => {
                      e.stopPropagation()
                      addItem(product, 1)
                    }}
                  >
                    Agregar
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
