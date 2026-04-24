'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Printer, Search, Package } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
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

interface Props {
  params: Promise<{ orgSlug: string }>
}

type Product = Database['public']['Tables']['products']['Row']

interface LabelProduct extends Product {
  qty: number
  selected: boolean
}

export default function EtiquetasPage({ params }: Props) {
  const [orgSlug, setOrgSlug] = useState('')
  const [products, setProducts] = useState<LabelProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [labelSize, setLabelSize] = useState('58x40')

  useEffect(() => {
    params.then(p => setOrgSlug(p.orgSlug))
  }, [params])

  const loadData = useCallback(async () => {
    if (!orgSlug) return
    const supabase = createClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()
    if (!org) return

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('name')

    setProducts((data || []).map(p => ({ ...p, qty: 1, selected: false })))
    setLoading(false)
  }, [orgSlug])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  )

  const selected = products.filter(p => p.selected)

  function toggleProduct(id: string) {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, selected: !p.selected } : p
    ))
  }

  function updateQty(id: string, qty: number) {
    setProducts(prev => prev.map(p =>
      p.id === id ? { ...p, qty: Math.max(1, qty) } : p
    ))
  }

  function handlePrint() {
    if (selected.length === 0) {
      toast.error('Seleccioná al menos un producto')
      return
    }

    const [w, h] = labelSize.split('x').map(Number)

    const labelsHtml = selected.flatMap(p =>
      Array(p.qty).fill(null).map(() => `
        <div class="label" style="width:${w}mm; height:${h}mm;">
          <p class="product-name">${p.name}</p>
          ${p.brand ? `<p class="brand">${p.brand}</p>` : ''}
          <p class="price">${formatARS(p.price_sell)}</p>
          ${p.barcode ? `<div class="barcode-text">${p.barcode}</div>` : ''}
        </div>
      `)
    ).join('')

    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) return

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Etiquetas</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; }
          .labels { display: flex; flex-wrap: wrap; gap: 2mm; padding: 2mm; }
          .label {
            border: 0.5px solid #ccc;
            padding: 2mm;
            display: flex;
            flex-direction: column;
            justify-content: center;
            overflow: hidden;
          }
          .product-name { font-size: 10px; font-weight: bold; line-height: 1.2; }
          .brand { font-size: 8px; color: #666; }
          .price { font-size: 14px; font-weight: bold; margin-top: 2mm; }
          .barcode-text { font-family: monospace; font-size: 8px; margin-top: 1mm; }
          @media print { html, body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="labels">${labelsHtml}</div>
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/${orgSlug}/productos`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Imprimir etiquetas</h1>
          <p className="text-sm text-muted-foreground">
            {selected.length} producto{selected.length !== 1 ? 's' : ''} seleccionado{selected.length !== 1 ? 's' : ''}
            {selected.length > 0 ? ` · ${selected.reduce((sum, p) => sum + p.qty, 0)} etiquetas` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <Select value={labelSize} onValueChange={v => v && setLabelSize(v)}>
              <SelectTrigger className="w-36 rounded-xl h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="58x40">58×40 mm</SelectItem>
                <SelectItem value="40x30">40×30 mm</SelectItem>
                <SelectItem value="80x50">80×50 mm</SelectItem>
                <SelectItem value="100x50">100×50 mm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handlePrint}
            disabled={selected.length === 0}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" />
            Imprimir ({selected.reduce((sum, p) => sum + p.qty, 0)})
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(product => (
            <Card
              key={product.id}
              className={`border transition-colors cursor-pointer ${
                product.selected
                  ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20'
                  : 'border-border/60'
              }`}
              onClick={() => toggleProduct(product.id)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={product.selected}
                  onChange={() => toggleProduct(product.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 rounded accent-indigo-600"
                />

                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.barcode || product.sku || 'Sin código'}
                    {product.brand ? ` · ${product.brand}` : ''}
                  </p>
                </div>

                <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
                  {formatARS(product.price_sell)}
                </p>

                {product.selected && (
                  <div
                    className="flex items-center gap-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => updateQty(product.id, product.qty - 1)}
                      className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm hover:bg-muted"
                    >
                      −
                    </button>
                    <Input
                      type="number"
                      value={product.qty}
                      onChange={e => updateQty(product.id, parseInt(e.target.value) || 1)}
                      className="w-14 h-7 text-center text-sm rounded-lg"
                      min="1"
                    />
                    <button
                      onClick={() => updateQty(product.id, product.qty + 1)}
                      className="w-7 h-7 rounded-lg border flex items-center justify-center text-sm hover:bg-muted"
                    >
                      +
                    </button>
                    <Label className="text-xs text-muted-foreground">
                      etiq.
                    </Label>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
