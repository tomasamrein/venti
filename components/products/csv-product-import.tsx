'use client'

import { useState, useRef } from 'react'
import { Upload, Download, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  open: boolean
  onClose: () => void
  orgId: string
  onDone: () => void
}

const TEMPLATE_HEADERS = 'name,barcode,sku,brand,unit,price_cost,price_sell,stock_current,stock_min,category'
const TEMPLATE_EXAMPLE = 'Coca Cola 500ml,7790895000061,CC500,Coca-Cola,un,350,500,24,6,Bebidas\nAlfajor Jorgito,7790987654321,AJ001,Jorgito,un,120,180,12,4,Golosinas'

export function CsvProductImport({ open, onClose, orgId, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ inserted: number; skipped_errors: string[] } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setResult(null)
    Papa.parse<Record<string, string>>(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setPreview(res.data.slice(0, 5)),
    })
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_HEADERS + '\n' + TEMPLATE_EXAMPLE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_productos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleImport() {
    if (!file) return
    setLoading(true)

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        try {
          const response = await fetch('/api/products/import-csv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ org_id: orgId, rows: res.data }),
          })
          const data = await response.json()
          if (!response.ok) {
            toast.error(data.error || 'Error al importar')
            setLoading(false)
            return
          }
          setResult(data)
          toast.success(`${data.inserted} producto${data.inserted !== 1 ? 's' : ''} importado${data.inserted !== 1 ? 's' : ''}`)
          onDone()
        } catch {
          toast.error('Error de conexión')
        }
        setLoading(false)
      },
    })
  }

  function handleClose() {
    setFile(null)
    setPreview([])
    setResult(null)
    onClose()
  }

  const previewCols = preview.length > 0 ? Object.keys(preview[0]).slice(0, 5) : []

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar productos desde CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
            <div>
              <p className="text-sm font-medium">Plantilla de ejemplo</p>
              <p className="text-xs text-muted-foreground">Descargá la plantilla, completá y subí</p>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate} className="gap-2">
              <Download className="h-4 w-4" />
              Descargar
            </Button>
          </div>

          {/* Columns reference */}
          <div className="text-xs text-muted-foreground space-y-1 px-1">
            <p className="font-medium text-foreground">Columnas soportadas:</p>
            <p><span className="font-mono bg-muted px-1 rounded">name</span> (requerido), <span className="font-mono bg-muted px-1 rounded">barcode</span>, <span className="font-mono bg-muted px-1 rounded">sku</span>, <span className="font-mono bg-muted px-1 rounded">brand</span>, <span className="font-mono bg-muted px-1 rounded">unit</span>, <span className="font-mono bg-muted px-1 rounded">price_cost</span>, <span className="font-mono bg-muted px-1 rounded">price_sell</span>, <span className="font-mono bg-muted px-1 rounded">stock_current</span>, <span className="font-mono bg-muted px-1 rounded">stock_min</span>, <span className="font-mono bg-muted px-1 rounded">category</span></p>
            <p className="text-muted-foreground">Si el producto tiene código de barras y ya existe, se actualiza. Sin código, siempre se crea nuevo.</p>
          </div>

          {/* File drop zone */}
          {!file ? (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors"
              onClick={() => inputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault()
                const f = e.dataTransfer.files[0]
                if (f?.name.endsWith('.csv')) handleFile(f)
                else toast.error('Solo se aceptan archivos .csv')
              }}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Arrastrá tu CSV aquí o hacé clic para seleccionar</p>
              <input
                ref={inputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* File info */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-300">{file.name}</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">{preview.length}+ filas</span>
                </div>
                <button onClick={() => { setFile(null); setPreview([]); setResult(null) }}>
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Preview table */}
              {preview.length > 0 && (
                <div className="rounded-lg border border-border overflow-auto max-h-40">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        {previewCols.map(col => (
                          <th key={col} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {previewCols.map(col => (
                            <td key={col} className="px-3 py-1.5 text-foreground truncate max-w-[120px]">{row[col] || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>{result.inserted} productos importados correctamente</span>
              </div>
              {result.skipped_errors.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {result.skipped_errors.length} fila{result.skipped_errors.length !== 1 ? 's' : ''} con errores (ignoradas)
                  </div>
                  {result.skipped_errors.slice(0, 3).map((e, i) => (
                    <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400 pl-5">{e}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button
              onClick={handleImport}
              disabled={!file || loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Importar productos
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
