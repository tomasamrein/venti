'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Save, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface ProductFormProps {
  orgSlug: string
  orgId: string
  product?: Product
}

export function ProductForm({ orgSlug, orgId, product }: ProductFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  // Form fields
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'un')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [priceCost, setPriceCost] = useState(product?.price_cost?.toString() ?? '')
  const [priceSell, setPriceSell] = useState(product?.price_sell?.toString() ?? '')
  const [priceSellB, setPriceSellB] = useState(product?.price_sell_b?.toString() ?? '')
  const [taxRate, setTaxRate] = useState(product?.tax_rate?.toString() ?? '21')
  const [stockCurrent, setStockCurrent] = useState(product?.stock_current?.toString() ?? '0')
  const [stockMin, setStockMin] = useState(product?.stock_min?.toString() ?? '0')
  const [trackStock, setTrackStock] = useState(product?.track_stock ?? true)
  const [allowNegative, setAllowNegative] = useState(product?.allow_negative ?? false)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false)
  const [isActive, setIsActive] = useState(product?.is_active ?? true)

  const isNew = !product

  const margin = priceCost && priceSell
    ? ((parseFloat(priceSell) - parseFloat(priceCost)) / parseFloat(priceCost) * 100).toFixed(1)
    : null

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('product_categories')
        .select('id, name')
        .eq('organization_id', orgId)
        .order('name')
      setCategories(data || [])
    }
    if (orgId) load()
  }, [orgId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('El nombre es obligatorio')
      return
    }
    if (!priceSell || parseFloat(priceSell) < 0) {
      toast.error('El precio de venta es obligatorio')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()

      const payload = {
        organization_id: orgId,
        name: name.trim(),
        description: description.trim() || null,
        barcode: barcode.trim() || null,
        sku: sku.trim() || null,
        brand: brand.trim() || null,
        unit,
        category_id: categoryId || null,
        price_cost: priceCost ? parseFloat(priceCost) : null,
        price_sell: parseFloat(priceSell),
        price_sell_b: priceSellB ? parseFloat(priceSellB) : null,
        tax_rate: parseFloat(taxRate) || 21,
        stock_current: parseFloat(stockCurrent) || 0,
        stock_min: parseFloat(stockMin) || 0,
        track_stock: trackStock,
        allow_negative: allowNegative,
        is_featured: isFeatured,
        is_active: isActive,
      }

      if (isNew) {
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        toast.success('Producto creado')
      } else {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product!.id)
        if (error) throw error
        toast.success('Producto actualizado')
      }

      router.push(`/${orgSlug}/productos`)
    } catch (err: any) {
      if (err?.code === '23505') {
        toast.error('Ya existe un producto con ese código de barras')
      } else {
        toast.error('Error al guardar el producto')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => router.push(`/${orgSlug}/productos`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isNew ? 'Nuevo producto' : 'Editar producto'}
          </h1>
        </div>
        <Button
          type="submit"
          disabled={submitting}
          className="gap-2 bg-indigo-600 hover:bg-indigo-700"
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name" className="mb-2 block">Nombre <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Coca Cola 500ml"
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="mb-2 block">Descripción</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descripción opcional..."
                  className="rounded-xl"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand" className="mb-2 block">Marca</Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="Ej: Coca Cola"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="unit" className="mb-2 block">Unidad</Label>
                  <Select value={unit} onValueChange={v => v && setUnit(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidad (un)</SelectItem>
                      <SelectItem value="kg">Kilogramo (kg)</SelectItem>
                      <SelectItem value="g">Gramo (g)</SelectItem>
                      <SelectItem value="l">Litro (l)</SelectItem>
                      <SelectItem value="ml">Mililitro (ml)</SelectItem>
                      <SelectItem value="m">Metro (m)</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="barcode" className="mb-2 block">Código de barras</Label>
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={e => setBarcode(e.target.value)}
                    placeholder="EAN13, QR..."
                    className="rounded-xl font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="sku" className="mb-2 block">SKU interno</Label>
                  <Input
                    id="sku"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="Código interno"
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category" className="mb-2 block">Categoría</Label>
                <Select value={categoryId || 'none'} onValueChange={v => v && setCategoryId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_cost" className="mb-2 block">Precio de costo</Label>
                  <Input
                    id="price_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceCost}
                    onChange={e => setPriceCost(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="price_sell" className="mb-2 block">
                    Precio de venta <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="price_sell"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceSell}
                    onChange={e => setPriceSell(e.target.value)}
                    placeholder="0.00"
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>

              {margin && (
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  Margen: {margin}% — Ganancia: {priceCost && priceSell
                    ? formatARS(parseFloat(priceSell) - parseFloat(priceCost))
                    : '—'}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_sell_b" className="mb-2 block">
                    Precio lista B (mayorista)
                  </Label>
                  <Input
                    id="price_sell_b"
                    type="number"
                    step="0.01"
                    min="0"
                    value={priceSellB}
                    onChange={e => setPriceSellB(e.target.value)}
                    placeholder="Opcional"
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="tax_rate" className="mb-2 block">IVA %</Label>
                  <Select value={taxRate} onValueChange={v => v && setTaxRate(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0% (Exento)</SelectItem>
                      <SelectItem value="10.5">10.5%</SelectItem>
                      <SelectItem value="21">21%</SelectItem>
                      <SelectItem value="27">27%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Stock */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Controlar stock</p>
                  <p className="text-xs text-muted-foreground">Descuenta al vender</p>
                </div>
                <Switch checked={trackStock} onCheckedChange={setTrackStock} />
              </div>

              {trackStock && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Permitir negativo</p>
                      <p className="text-xs text-muted-foreground">Vender sin stock</p>
                    </div>
                    <Switch checked={allowNegative} onCheckedChange={setAllowNegative} />
                  </div>

                  <div>
                    <Label htmlFor="stock_current" className="mb-2 block">Stock actual</Label>
                    <Input
                      id="stock_current"
                      type="number"
                      step="0.001"
                      value={stockCurrent}
                      onChange={e => setStockCurrent(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="stock_min" className="mb-2 block">Stock mínimo (alerta)</Label>
                    <Input
                      id="stock_min"
                      type="number"
                      step="0.001"
                      min="0"
                      value={stockMin}
                      onChange={e => setStockMin(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-base">Estado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Activo</p>
                  <p className="text-xs text-muted-foreground">Visible en el POS</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Destacado</p>
                  <p className="text-xs text-muted-foreground">Aparece primero</p>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
