'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import type { Database } from '@/types/database'
import type { ParsedPriceRow } from '@/app/api/products/parse-excel/route'

type Product = Database['public']['Tables']['products']['Row']

interface MatchedRow extends ParsedPriceRow {
  product: Product | null
  status: 'matched' | 'not_found'
}

interface Props {
  open: boolean
  onClose: () => void
  products: Product[]
  onDone: () => void
}

export function ExcelPriceImport({ open, onClose, products, onDone }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<MatchedRow[]>([])
  const [applying, setApplying] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setStep('upload')
    setRows([])
    onClose()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch('/api/products/parse-excel', { method: 'POST', body: form })
      const json = await res.json()

      if (!res.ok || json.error) {
        toast.error(json.error ?? 'Error al procesar el archivo')
        return
      }

      const parsed: ParsedPriceRow[] = json.rows

      // Match parsed rows against org products
      const matched: MatchedRow[] = parsed.map(row => {
        let product: Product | null = null

        if (row.barcode) {
          product = products.find(p => p.barcode === row.barcode) ?? null
        }
        if (!product && row.sku) {
          product = products.find(p => p.sku?.toLowerCase() === row.sku?.toLowerCase()) ?? null
        }
        if (!product && row.name) {
          product = products.find(
            p => p.name.toLowerCase() === row.name?.toLowerCase()
          ) ?? null
        }

        return { ...row, product, status: product ? 'matched' : 'not_found' }
      })

      setRows(matched)
      setStep('preview')
    } catch {
      toast.error('Error al leer el archivo')
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  async function handleApply() {
    const toUpdate = rows.filter(r => r.status === 'matched' && r.product)
    if (!toUpdate.length) return

    setApplying(true)
    const supabase = createClient()

    let ok = 0
    let fail = 0

    // Batch updates — up to 50 at a time
    const chunks = []
    for (let i = 0; i < toUpdate.length; i += 50) chunks.push(toUpdate.slice(i, i + 50))

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async row => {
          const updates: Partial<Product> = {}
          if (row.price_sell != null) updates.price_sell = row.price_sell
          if (row.price_cost != null) updates.price_cost = row.price_cost

          const { error } = await supabase
            .from('products')
            .update(updates)
            .eq('id', row.product!.id)

          if (error) { fail++ } else { ok++ }
        })
      )
    }

    if (fail > 0) toast.error(`${fail} productos no se pudieron actualizar`)
    if (ok > 0) toast.success(`${ok} productos actualizados correctamente`)

    setStep('done')
    onDone()
    setApplying(false)
  }

  const matched = rows.filter(r => r.status === 'matched')
  const notFound = rows.filter(r => r.status === 'not_found')

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-3xl rounded-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar precios desde Excel</DialogTitle>
          <DialogDescription>
            Subí un archivo .xlsx con columnas: código/barcode, precio_venta y/o precio_costo.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <FileSpreadsheet className="h-8 w-8 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Seleccioná el archivo Excel</p>
              <p className="text-xs text-muted-foreground mt-1">
                Columnas aceptadas: <code>barcode</code>, <code>sku</code>, <code>nombre</code>, <code>precio_venta</code>, <code>precio_costo</code>
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Procesando...</>
              ) : (
                <><Upload className="h-4 w-4" />Elegir archivo</>
              )}
            </Button>

            <div className="mt-2 p-4 rounded-xl border bg-muted/30 text-xs text-muted-foreground max-w-md">
              <p className="font-medium text-foreground mb-1">Formato esperado:</p>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left pr-4">barcode</th>
                    <th className="text-left pr-4">nombre</th>
                    <th className="text-right pr-4">precio_venta</th>
                    <th className="text-right">precio_costo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="pr-4">7790001</td>
                    <td className="pr-4">Coca Cola 2L</td>
                    <td className="text-right pr-4">2500</td>
                    <td className="text-right">1800</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <>
            {/* Summary badges */}
            <div className="flex gap-3 flex-wrap mb-1">
              <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">{matched.length}</span> encontrados
              </div>
              {notFound.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">{notFound.length}</span> no encontrados
                </div>
              )}
            </div>

            {/* Preview table */}
            <div className="flex-1 overflow-y-auto border rounded-xl">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-background border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Producto</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Precio costo</th>
                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Precio venta</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <p className="font-medium">{row.product?.name ?? row.name ?? '—'}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {row.barcode ?? row.sku ?? ''}
                        </p>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.price_cost != null ? (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            {formatARS(row.price_cost)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">sin cambio</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.price_sell != null ? (
                          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                            {formatARS(row.price_sell)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">sin cambio</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.status === 'matched' ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground inline" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={handleApply}
                disabled={applying || matched.length === 0}
              >
                {applying ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Aplicando...</>
                ) : (
                  `Actualizar ${matched.length} producto${matched.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            <p className="text-base font-semibold">¡Precios actualizados!</p>
            <Button onClick={handleClose} className="rounded-xl">Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
