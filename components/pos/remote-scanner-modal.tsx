'use client'

import { useEffect, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Smartphone, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  sessionId: string
  orgSlug: string
  onBarcode: (barcode: string) => void
}

export function RemoteScannerModal({ open, onClose, sessionId, orgSlug, onBarcode }: Props) {
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const url = `${origin}/${orgSlug}/scan/${sessionId}`

  const handleBarcode = useCallback((code: string) => {
    setLastScan(code)
    onBarcode(code)
  }, [onBarcode])

  useEffect(() => {
    if (!open) return
    const supabase = createClient()
    const channel = supabase
      .channel(`scanner:${sessionId}`)
      .on('broadcast', { event: 'scan' }, ({ payload }) => {
        handleBarcode(payload.barcode as string)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [open, sessionId, handleBarcode])

  function copy() {
    navigator.clipboard.writeText(url)
    toast.success('URL copiada')
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Escáner remoto
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <p className="text-sm text-muted-foreground text-center">
            Escaneá el QR con el celular para abrir el escáner. Los productos se agregan al carrito en tiempo real.
          </p>

          {origin && (
            <div className="rounded-xl border p-3 bg-white">
              <QRCodeSVG value={url} size={200} />
            </div>
          )}

          <div className="flex items-center gap-2 w-full">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg truncate">{url}</code>
            <Button size="icon" variant="outline" onClick={copy} className="shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {lastScan && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" />
              <span>Último scan: <span className="font-mono">{lastScan}</span></span>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Dejá este dialog abierto mientras usás el celular como escáner.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
