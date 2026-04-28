'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Search, Filter, Package, TrendingUp, TrendingDown,
  MoreHorizontal, Pencil, Trash2, AlertTriangle, Upload, Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { BulkPriceUpdate } from '@/components/products/bulk-price-update'
import { ExcelPriceImport } from '@/components/products/excel-price-import'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import { useOrg } from '@/hooks/use-org'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row'] & {
  product_categories: { name: string; color: string | null } | null
}

interface Category {
  id: string
  name: string
}

export default function ProductosPage() {
  const router = useRouter()
  const { org } = useOrg()
  const orgSlug = org.slug
  const orgId = org.id

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [excelOpen, setExcelOpen] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase
        .from('products')
        .select('*, product_categories(name, color)')
        .eq('organization_id', orgId)
        .order('name'),
      supabase
        .from('product_categories')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name'),
    ])
    setProducts((prods as Product[]) || [])
    setCategories(cats || [])
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      toast.error('Error al eliminar el producto')
    } else {
      toast.success('Producto desactivado')
      setProducts(prev => prev.filter(p => p.id !== id))
    }
    setDeleteId(null)
  }

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())

    const matchCategory = categoryFilter === 'all' || p.category_id === categoryFilter

    const matchStock = stockFilter === 'all' ||
      (stockFilter === 'low' && p.track_stock && p.stock_current <= p.stock_min && p.stock_current > 0) ||
      (stockFilter === 'out' && p.track_stock && p.stock_current <= 0) ||
      (stockFilter === 'ok' && (!p.track_stock || p.stock_current > p.stock_min))

    return matchSearch && matchCategory && matchStock
  })

  const lowStockCount = products.filter(
    p => p.track_stock && p.stock_current <= p.stock_min && p.stock_current > 0
  ).length

  const outStockCount = products.filter(
    p => p.track_stock && p.stock_current <= 0
  ).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} producto{products.length !== 1 ? 's' : ''} en el catálogo
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${orgSlug}/productos/categorias`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Tag className="h-4 w-4" />
              Categorías
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setExcelOpen(true)}>
            <Upload className="h-4 w-4" />
            Importar Excel
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setBulkOpen(true)}>
            <TrendingUp className="h-4 w-4" />
            Actualizar precios
          </Button>
          <Link href={`/${orgSlug}/productos/nuevo`}>
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stock alerts */}
      {(lowStockCount > 0 || outStockCount > 0) && (
        <div className="flex gap-3">
          {outStockCount > 0 && (
            <button
              onClick={() => setStockFilter('out')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm"
            >
              <AlertTriangle className="h-4 w-4" />
              {outStockCount} sin stock
            </button>
          )}
          {lowStockCount > 0 && (
            <button
              onClick={() => setStockFilter('low')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 text-sm"
            >
              <AlertTriangle className="h-4 w-4" />
              {lowStockCount} con stock bajo
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, código, SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>

        <Select value={categoryFilter} onValueChange={v => v && setCategoryFilter(v)}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={v => v && setStockFilter(v)}>
          <SelectTrigger className="w-40 rounded-xl">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el stock</SelectItem>
            <SelectItem value="ok">Stock normal</SelectItem>
            <SelectItem value="low">Stock bajo</SelectItem>
            <SelectItem value="out">Sin stock</SelectItem>
          </SelectContent>
        </Select>

        {(search || categoryFilter !== 'all' || stockFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setCategoryFilter('all'); setStockFilter('all') }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Products table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {products.length === 0
                  ? 'No hay productos todavía. ¡Cargá el primero!'
                  : 'No hay productos que coincidan con los filtros.'}
              </p>
              {products.length === 0 && (
                <Link href={`/${orgSlug}/productos/nuevo`}>
                  <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                    Crear primer producto
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Producto</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Categoría</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Código</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio costo</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Precio venta</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Stock</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(product => {
                    const isOutStock = product.track_stock && product.stock_current <= 0
                    const isLowStock = product.track_stock && product.stock_current > 0 && product.stock_current <= product.stock_min
                    const margin = product.price_cost
                      ? ((product.price_sell - product.price_cost) / product.price_cost) * 100
                      : null

                    return (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-10 h-10 rounded-lg object-cover bg-muted shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.brand && (
                                <p className="text-xs text-muted-foreground">{product.brand}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {product.product_categories ? (
                            <Badge
                              variant="outline"
                              style={product.product_categories.color
                                ? { borderColor: product.product_categories.color, color: product.product_categories.color }
                                : undefined
                              }
                              className="text-xs"
                            >
                              {product.product_categories.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">Sin categoría</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground font-mono text-xs">
                          {product.barcode || product.sku || '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {product.price_cost != null
                            ? <span className="text-muted-foreground">{formatARS(product.price_cost)}</span>
                            : <span className="text-muted-foreground">—</span>
                          }
                          {margin != null && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              {margin.toFixed(0)}% margen
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                          {formatARS(product.price_sell)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!product.track_stock ? (
                            <span className="text-xs text-muted-foreground">Sin control</span>
                          ) : isOutStock ? (
                            <Badge variant="destructive" className="text-xs">Sin stock</Badge>
                          ) : isLowStock ? (
                            <Badge className="text-xs bg-yellow-500 hover:bg-yellow-500">
                              {product.stock_current} {product.unit}
                            </Badge>
                          ) : (
                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {product.stock_current} {product.unit}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => router.push(`/${orgSlug}/productos/${product.id}`)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => setDeleteId(product.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desactivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              El producto no se mostrará en el POS ni en el catálogo. Podés reactivarlo desde la edición.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk price update */}
      <BulkPriceUpdate
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        orgId={orgId}
        onDone={loadData}
      />

      {/* Excel price import */}
      <ExcelPriceImport
        open={excelOpen}
        onClose={() => setExcelOpen(false)}
        products={products}
        onDone={loadData}
      />
    </div>
  )
}
