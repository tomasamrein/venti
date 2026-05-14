'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Save, Package2, ScanBarcode, ImagePlus, X,
  TrendingUp, AlertCircle, Sparkles, Tag, Boxes, DollarSign, CircleCheck,
  Upload, Camera, Loader2,
} from 'lucide-react'
import { UsbScannerInput } from '@/components/pos/usb-scanner-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import type { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface ProductFormProps {
  orgSlug: string
  orgId: string
  product?: Product
  initialBarcode?: string
}

const MARKUP_CHIPS = [
  { label: '+20%', mult: 1.2 },
  { label: '+30%', mult: 1.3 },
  { label: '+50%', mult: 1.5 },
  { label: '×2', mult: 2 },
  { label: '×3', mult: 3 },
]

export function ProductForm({ orgSlug, orgId, product, initialBarcode }: ProductFormProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [barcode, setBarcode] = useState(product?.barcode ?? initialBarcode ?? '')
  const [sku, setSku] = useState(product?.sku ?? '')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [unit, setUnit] = useState(product?.unit ?? 'un')
  const [categoryId, setCategoryId] = useState(product?.category_id ?? '')
  const [imageUrl, setImageUrl] = useState(product?.image_url ?? '')
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

  const [scannerOpen, setScannerOpen] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const isNew = !product

  async function compressImage(file: File, maxSize = 800, quality = 0.82): Promise<Blob> {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(bitmap, 0, 0, w, h)
    return new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('compress failed')), 'image/jpeg', quality)
    })
  }

  async function handleImageUpload(file: File | null | undefined) {
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo imágenes'); return }
    setUploadingImage(true)
    try {
      const blob = await compressImage(file)
      const supabase = createClient()
      const path = `${orgId}/${crypto.randomUUID()}.jpg`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path)
      setImageUrl(publicUrl)
      toast.success('Imagen subida')
    } catch (err) {
      console.error(err)
      toast.error('No se pudo subir la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  const costNum = parseFloat(priceCost) || 0
  const sellNum = parseFloat(priceSell) || 0
  const profit = sellNum - costNum
  const marginPct = costNum > 0 ? (profit / costNum) * 100 : null
  const hasMarginData = costNum > 0 && sellNum > 0

  const isDecimalUnit = ['kg', 'g', 'l', 'ml', 'm'].includes(unit)
  const stockStep = isDecimalUnit ? '0.001' : '1'
  const stockNum = parseFloat(stockCurrent) || 0
  const stockMinNum = parseFloat(stockMin) || 0
  const stockStatus =
    !trackStock ? 'untracked'
      : stockNum <= 0 ? 'out'
      : stockNum <= stockMinNum ? 'low'
      : 'ok'

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        ;(document.getElementById('product-form') as HTMLFormElement | null)?.requestSubmit()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function applyMarkup(mult: number) {
    if (!costNum) {
      toast.error('Cargá primero el precio de costo')
      return
    }
    setPriceSell((costNum * mult).toFixed(2))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('El nombre es obligatorio'); return }
    if (!priceSell || parseFloat(priceSell) < 0) { toast.error('El precio de venta es obligatorio'); return }

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
        image_url: imageUrl.trim() || null,
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
        const { organization_id: _oid, ...updatePayload } = payload
        const { error } = await supabase
          .from('products').update(updatePayload)
          .eq('id', product!.id).eq('organization_id', orgId)
        if (error) throw error
        toast.success('Producto actualizado')
      }
      router.push(`/${orgSlug}/productos`)
    } catch (err: any) {
      if (err?.code === '23505') toast.error('Ya existe un producto con ese código de barras')
      else toast.error('Error al guardar el producto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form id="product-form" onSubmit={handleSubmit} className="pb-24 lg:pb-6">
      {/* Sticky header with live preview */}
      <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-3 mb-6 bg-background/80 backdrop-blur-md border-b border-border/60">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Button
            type="button" variant="ghost" size="sm" className="gap-2 shrink-0"
            onClick={() => router.push(`/${orgSlug}/productos`)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Volver</span>
          </Button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-muted/60 border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Package2 className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground leading-none">
                {isNew ? 'Nuevo producto' : 'Editando'}
              </p>
              <p className="text-sm font-bold truncate leading-tight mt-0.5">
                {name.trim() || <span className="text-muted-foreground italic font-normal">Sin nombre…</span>}
              </p>
            </div>
            {sellNum > 0 && (
              <div className="hidden sm:flex flex-col items-end leading-none">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Precio</span>
                <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                  {formatARS(sellNum)}
                </span>
              </div>
            )}
          </div>

          <Button
            type="submit" disabled={submitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">{submitting ? 'Guardando…' : 'Guardar'}</span>
            <kbd className="hidden lg:inline-flex ml-1 items-center gap-0.5 px-1 py-0 rounded bg-emerald-700/40 text-[9px] font-mono">⌘S</kbd>
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-5">
        {/* LEFT — main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Identity */}
          <Card className="border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Tag className="h-3.5 w-3.5" />
                </span>
                Identidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {/* Image */}
                <div className="shrink-0">
                  <Label className="mb-2 block text-xs">Imagen</Label>
                  <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-border bg-muted/30 overflow-hidden flex items-center justify-center group">
                    {uploadingImage ? (
                      <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
                    ) : imageUrl ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <ImagePlus className="h-7 w-7 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex gap-1 mt-2 w-24">
                    <input
                      ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { handleImageUpload(e.target.files?.[0]); e.target.value = '' }}
                    />
                    <input
                      ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                      onChange={e => { handleImageUpload(e.target.files?.[0]); e.target.value = '' }}
                    />
                    <Button
                      type="button" variant="outline" size="sm"
                      className="flex-1 h-7 px-0 rounded-md"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImage}
                      title="Subir archivo"
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button" variant="outline" size="sm"
                      className="flex-1 h-7 px-0 rounded-md md:hidden"
                      onClick={() => cameraInputRef.current?.click()}
                      disabled={uploadingImage}
                      title="Tomar foto"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor="name" className="mb-1.5 block text-xs">
                      Nombre <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Ej: Coca Cola 500ml"
                      className="rounded-lg font-medium" required autoFocus={isNew}
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url" className="mb-1.5 block text-xs">o pegar URL</Label>
                    <Input
                      id="image_url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                      placeholder="https://…" className="rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="mb-1.5 block text-xs">Descripción</Label>
                <Textarea
                  id="description" value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Notas, variantes, presentación…"
                  className="rounded-lg text-sm" rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="brand" className="mb-1.5 block text-xs">Marca</Label>
                  <Input id="brand" value={brand} onChange={e => setBrand(e.target.value)}
                    placeholder="Ej: Coca Cola" className="rounded-lg" />
                </div>
                <div>
                  <Label htmlFor="category" className="mb-1.5 block text-xs">Categoría</Label>
                  <Select value={categoryId || 'none'} onValueChange={v => v && setCategoryId(v === 'none' ? '' : v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Sin categoría" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin categoría</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="unit" className="mb-1.5 block text-xs">Unidad</Label>
                  <Select value={unit} onValueChange={v => v && setUnit(v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="un">Unidad</SelectItem>
                      <SelectItem value="kg">Kilogramo</SelectItem>
                      <SelectItem value="g">Gramo</SelectItem>
                      <SelectItem value="l">Litro</SelectItem>
                      <SelectItem value="ml">Mililitro</SelectItem>
                      <SelectItem value="m">Metro</SelectItem>
                      <SelectItem value="caja">Caja</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <DollarSign className="h-3.5 w-3.5" />
                </span>
                Precios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price_cost" className="mb-1.5 block text-xs">Precio de costo</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      id="price_cost" type="number" step="0.01" min="0"
                      value={priceCost} onChange={e => setPriceCost(e.target.value)}
                      placeholder="0,00" className="rounded-lg pl-8 tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="price_sell" className="mb-1.5 block text-xs">
                    Precio de venta <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      id="price_sell" type="number" step="0.01" min="0"
                      value={priceSell} onChange={e => setPriceSell(e.target.value)}
                      placeholder="0,00" className="rounded-lg pl-8 font-bold tabular-nums" required
                    />
                  </div>
                </div>
              </div>

              {/* Markup chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mr-1">
                  <Sparkles className="h-3 w-3" />
                  Sugerencias:
                </span>
                {MARKUP_CHIPS.map(c => (
                  <button
                    key={c.label} type="button" onClick={() => applyMarkup(c.mult)}
                    disabled={!costNum}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-border bg-card hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:bg-card disabled:hover:text-foreground"
                  >
                    {c.label}
                    {costNum > 0 && (
                      <span className="ml-1 text-muted-foreground font-normal">
                        {formatARS(costNum * c.mult)}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Live margin */}
              {hasMarginData && (
                <div className={`rounded-xl border p-3 flex items-center gap-3 ${
                  profit < 0
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30'
                    : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30'
                }`}>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    profit < 0 ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {profit < 0 ? <AlertCircle className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[11px] font-semibold uppercase tracking-wide ${
                      profit < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {profit < 0 ? 'Estás vendiendo a pérdida' : 'Ganancia por unidad'}
                    </p>
                    <p className={`text-base font-black tabular-nums ${
                      profit < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'
                    }`}>
                      {formatARS(profit)} <span className="text-xs font-bold opacity-70">· Margen {marginPct?.toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price_sell_b" className="mb-1.5 block text-xs">Precio mayorista</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      id="price_sell_b" type="number" step="0.01" min="0"
                      value={priceSellB} onChange={e => setPriceSellB(e.target.value)}
                      placeholder="Opcional" className="rounded-lg pl-8 tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tax_rate" className="mb-1.5 block text-xs">IVA</Label>
                  <Select value={taxRate} onValueChange={v => v && setTaxRate(v)}>
                    <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
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

          {/* Codes */}
          <Card className="border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <ScanBarcode className="h-3.5 w-3.5" />
                </span>
                Códigos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="barcode" className="mb-1.5 block text-xs">Código de barras</Label>
                <div className="flex gap-1.5">
                  <Input
                    id="barcode" value={barcode} onChange={e => setBarcode(e.target.value)}
                    placeholder="EAN13, QR…" className="rounded-lg font-mono flex-1"
                  />
                  <Button
                    type="button" variant="outline" size="icon"
                    className="rounded-lg shrink-0"
                    onClick={() => setScannerOpen(true)} title="Escanear código"
                  >
                    <ScanBarcode className="h-4 w-4" />
                  </Button>
                </div>
                <UsbScannerInput
                  open={scannerOpen}
                  onScan={code => { setBarcode(code); setScannerOpen(false) }}
                  onClose={() => setScannerOpen(false)}
                />
              </div>
              <div>
                <Label htmlFor="sku" className="mb-1.5 block text-xs">SKU interno</Label>
                <Input
                  id="sku" value={sku} onChange={e => setSku(e.target.value)}
                  placeholder="Código interno" className="rounded-lg font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — sidebar */}
        <div className="space-y-5">
          {/* Stock */}
          <Card className="border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Boxes className="h-3.5 w-3.5" />
                </span>
                Stock
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-tight">Controlar stock</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Descuenta al vender</p>
                </div>
                <Switch checked={trackStock} onCheckedChange={setTrackStock} />
              </div>

              {trackStock && (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label htmlFor="stock_current" className="mb-1.5 block text-xs">Actual</Label>
                      <Input
                        id="stock_current" type="number" step={stockStep}
                        value={stockCurrent} onChange={e => setStockCurrent(e.target.value)}
                        className="rounded-lg text-center font-bold tabular-nums"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock_min" className="mb-1.5 block text-xs">Mínimo</Label>
                      <Input
                        id="stock_min" type="number" step={stockStep} min="0"
                        value={stockMin} onChange={e => setStockMin(e.target.value)}
                        className="rounded-lg text-center tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Stock health */}
                  <div className={`rounded-lg border p-2.5 flex items-center gap-2 text-[11px] font-semibold ${
                    stockStatus === 'out' ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300' :
                    stockStatus === 'low' ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300' :
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
                  }`}>
                    {stockStatus === 'out' ? <><AlertCircle className="h-3.5 w-3.5" /> Sin stock</> :
                     stockStatus === 'low' ? <><AlertCircle className="h-3.5 w-3.5" /> Stock bajo</> :
                     <><CircleCheck className="h-3.5 w-3.5" /> Stock saludable</>}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div>
                      <p className="text-sm font-medium leading-tight">Permitir negativo</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Vender sin stock</p>
                    </div>
                    <Switch checked={allowNegative} onCheckedChange={setAllowNegative} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card className="border-border/60 rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Visibilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-tight">Activo</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Visible en el POS</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-tight">Destacado</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Aparece primero</p>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sticky mobile save */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 p-3 bg-background/95 backdrop-blur-md border-t border-border/60">
        <Button
          type="submit" disabled={submitting}
          className="w-full h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
        >
          <Save className="h-4 w-4" />
          {submitting ? 'Guardando…' : isNew ? 'Crear producto' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  )
}
