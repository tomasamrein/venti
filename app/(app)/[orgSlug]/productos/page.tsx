'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, Search, Package, TrendingUp, TrendingDown,
  MoreHorizontal, Pencil, Trash2, AlertTriangle, Upload, Tag, Send, Smartphone,
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
import { RemoteScannerModal } from '@/components/pos/remote-scanner-modal'
import { ExcelPriceImport } from '@/components/products/excel-price-import'
import { CsvProductImport } from '@/components/products/csv-product-import'
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

interface Supplier {
  id: string
  name: string
  phone: string | null
  email: string | null
}

export default function ProductosPage() {
  const router = useRouter()
  const { org } = useOrg()
  const orgSlug = org.slug
  const orgId = org.id

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierProductMap, setSupplierProductMap] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [excelOpen, setExcelOpen] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [remoteScannerOpen, setRemoteScannerOpen] = useState(false)
  const [remoteScanSessionId] = useState(() => {
    const key = 'remote_scan_session_productos'
    const stored = sessionStorage.getItem(key)
    if (stored) return stored
    const id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
    return id
  })
  const [lastRemoteScan, setLastRemoteScan] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const [{ data: prods }, { data: cats }, { data: suppls }, { data: suppProds }] = await Promise.all([
      supabase
        .from('products')
        .select('*, product_categories(name, color)')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('product_categories')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name'),
      supabase
        .from('suppliers')
        .select('id, name, phone, email')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('supplier_products')
        .select('supplier_id, product_id')
        .eq('organization_id', orgId),
    ])
    setProducts((prods as Product[]) || [])
    setCategories(cats || [])
    setSuppliers((suppls as Supplier[]) || [])

    const map: Record<string, Set<string>> = {}
    for (const sp of suppProds ?? []) {
      if (!map[sp.supplier_id]) map[sp.supplier_id] = new Set()
      map[sp.supplier_id].add(sp.product_id)
    }
    setSupplierProductMap(map)
    setLoading(false)
  }, [orgId])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleDelete(id: string) {
    const supabase = createClient()

    // Try hard delete first (works if no sale_items reference it)
    const { error: hardErr } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (!hardErr) {
      toast.success('Producto eliminado')
      setProducts(prev => prev.filter(p => p.id !== id))
      setDeleteId(null)
      return
    }

    // FK violation → fall back to soft delete
    const { error: softErr } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)

    if (softErr) {
      toast.error('Error al eliminar el producto')
    } else {
      toast.success('Producto archivado (tiene ventas asociadas)')
      setProducts(prev => prev.filter(p => p.id !== id))
    }
    setDeleteId(null)
  }

  // Remote scanner: busca el producto; si no existe, redirige a nuevo con barcode pre-cargado
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`scanner:${remoteScanSessionId}`)
      .on('broadcast', { event: 'scan' }, ({ payload }) => {
        const code = payload.barcode as string
        setLastRemoteScan(code)
        const found = products.find(p => p.barcode === code)
        if (found) {
          setSearch(code)
          toast.success(`Producto encontrado: ${found.name}`)
        } else {
          router.push(`/${orgSlug}/productos/nuevo?barcode=${encodeURIComponent(code)}`)
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [remoteScanSessionId, products, orgSlug, router])

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

    const matchSupplier = supplierFilter === 'all' || supplierProductMap[supplierFilter]?.has(p.id)

    return matchSearch && matchCategory && matchStock && matchSupplier
  })

  function handleShareSupplierOrder() {
    const supplier = suppliers.find(s => s.id === supplierFilter)
    if (!supplier) return
    const lowStock = filtered.filter(p => p.track_stock && p.stock_current <= p.stock_min)
    const lines = lowStock.length > 0
      ? lowStock.map(p => `- ${p.name}: stock actual ${p.stock_current} ${p.unit} (mínimo ${p.stock_min})`).join('\n')
      : filtered.map(p => `- ${p.name}`).join('\n')
    const msg = encodeURIComponent(`Hola ${supplier.name}! Te mando la lista de pedido:\n\n${lines}\n\n¡Gracias!`)
    const contact = supplier.phone?.replace(/\D/g, '') ?? ''
    const url = contact ? `https://wa.me/${contact}?text=${msg}` : `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
  }

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
        <div className="flex items-center gap-2">
          {/* Secondary actions — hidden on mobile, visible md+ */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setRemoteScannerOpen(true)}>
              <Smartphone className="h-4 w-4" />
              Escáner remoto
            </Button>
            <Link href={`/${orgSlug}/productos/categorias`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Tag className="h-4 w-4" />
                Categorías
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setCsvOpen(true)}>
              <Upload className="h-4 w-4" />
              Importar CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setExcelOpen(true)}>
              <Upload className="h-4 w-4" />
              Importar Excel
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setBulkOpen(true)}>
              <TrendingUp className="h-4 w-4" />
              Actualizar precios
            </Button>
          </div>
          {/* Mobile: overflow dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm hover:bg-accent">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRemoteScannerOpen(true)} className="gap-2 cursor-pointer">
                  <Smartphone className="h-4 w-4" />
                  Escáner remoto
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push(`/${orgSlug}/productos/categorias`)} className="gap-2 cursor-pointer">
                  <Tag className="h-4 w-4" />
                  Categorías
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCsvOpen(true)} className="gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Importar CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setExcelOpen(true)} className="gap-2 cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Importar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBulkOpen(true)} className="gap-2 cursor-pointer">
                  <TrendingUp className="h-4 w-4" />
                  Actualizar precios
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href={`/${orgSlug}/productos/nuevo`}>
            <Button size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-600">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo producto</span>
              <span className="sm:hidden">Nuevo</span>
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

        {suppliers.length > 0 && (
          <Select value={supplierFilter} onValueChange={v => v && setSupplierFilter(v)}>
            <SelectTrigger className="w-44 rounded-xl">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proveedores</SelectItem>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {supplierFilter !== 'all' && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleShareSupplierOrder}
          >
            <Send className="h-4 w-4" />
            Enviar lista
          </Button>
        )}

        {(search || categoryFilter !== 'all' || stockFilter !== 'all' || supplierFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearch(''); setCategoryFilter('all'); setStockFilter('all'); setSupplierFilter('all') }}
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
                  <Button className="mt-4 bg-emerald-600 hover:bg-emerald-600">
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
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-600">
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

      {/* CSV product import */}
      <CsvProductImport
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        orgId={orgId}
        onDone={loadData}
      />

      <RemoteScannerModal
        open={remoteScannerOpen}
        onClose={() => setRemoteScannerOpen(false)}
        sessionId={remoteScanSessionId}
        orgSlug={orgSlug}
        lastScan={lastRemoteScan}
      />
    </div>
  )
}
