'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Smartphone, Copy, CheckCircle2, Wifi, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  sessionId: string
  orgSlug: string
  lastScan: string | null
}

export function RemoteScannerModal({ open, onClose, sessionId, orgSlug, lastScan }: Props) {
  const [origin, setOrigin] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  // Nueva URL pública — no requiere login
  const url = `${origin}/scan/${orgSlug}/${sessionId}`

  function copy() {
    navigator.clipboard.writeText(url)
    toast.success('URL copiada')
  }

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-6 py-6 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-left">
            <Smartphone className="h-5 w-5 text-emerald-600" />
            Escáner remoto
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-4 pt-4">
          {isMobile ? (
            // En móvil: mostrar botón directo en vez de QR
            <>
              <p className="text-sm text-muted-foreground text-center">
                Abrí el escáner en esta misma pantalla para escanear desde la cámara.
              </p>
              <Button
                className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={() => window.open(url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                Abrir escáner
              </Button>
            </>
          ) : (
            // En desktop: mostrar QR
            <>
              <p className="text-sm text-muted-foreground text-center">
                Escaneá este QR con el celular. La cámara arranca sola y los códigos se agregan al carrito aunque cierres este panel.
              </p>

              {origin && (
                <div className="rounded-xl border p-3 bg-white">
                  <QRCodeSVG value={url} size={200} />
                </div>
              )}

              <div className="flex items-center gap-2 w-full max-w-sm">
                <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg truncate">{url}</code>
                <Button size="icon" variant="outline" onClick={copy} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full w-full max-w-sm justify-center
            ${lastScan
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'}`}>
            {lastScan
              ? <><CheckCircle2 className="h-4 w-4" />Último scan: <span className="font-mono">{lastScan}</span></>
              : <><Wifi className="h-4 w-4" />Esperando scans...</>
            }
          </div>

          {!isMobile && (
            <p className="text-xs text-muted-foreground text-center">
              Podés cerrar este panel — el escáner sigue activo mientras estés en el POS.
            </p>
          )}

          <Button variant="outline" className="w-full max-w-sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
