'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Smartphone, Copy, CheckCircle2, Wifi, Scan } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onClose: () => void
  sessionId: string
  orgSlug: string
  lastScan: string | null
  onScan: (barcode: string) => void
}

export function RemoteScannerModal({ open, onClose, sessionId, orgSlug, lastScan, onScan }: Props) {
  const [origin, setOrigin] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [lastMobileScan, setLastMobileScan] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const lastScanRef = useRef<{ code: string; ts: number } | null>(null)
  const COOLDOWN_MS = 2500

  useEffect(() => {
    setOrigin(window.location.origin)
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  // Auto-start camera when mobile opens the sheet
  useEffect(() => {
    if (open && isMobile) startCamera()
    if (!open) stopCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isMobile])

  useEffect(() => () => { controlsRef.current?.stop() }, [])

  async function startCamera() {
    if (!videoRef.current) return
    setScanning(true)
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result) return
          const code = result.getText()
          const now = Date.now()
          const last = lastScanRef.current
          if (last && last.code === code && now - last.ts < COOLDOWN_MS) return
          lastScanRef.current = { code, ts: now }
          onScan(code)
          setLastMobileScan(code)
          try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 1200
            gain.gain.setValueAtTime(0.15, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
            osc.start()
            osc.stop(ctx.currentTime + 0.12)
          } catch { /* ignore */ }
        }
      )
      controlsRef.current = controls
    } catch {
      toast.error('No se pudo acceder a la cámara')
      setScanning(false)
    }
  }

  function stopCamera() {
    controlsRef.current?.stop()
    controlsRef.current = null
    setScanning(false)
  }

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
            {isMobile ? 'Escáner' : 'Escáner remoto'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col items-center gap-4 pt-4">
          {isMobile ? (
            // Móvil: cámara inline directa
            <>
              <div className="w-full max-w-sm aspect-square rounded-2xl overflow-hidden bg-black relative border border-border">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
                    <Scan className="h-10 w-10 text-white/60" />
                    <Button onClick={startCamera} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      Iniciar cámara
                    </Button>
                  </div>
                )}
              </div>

              {lastMobileScan && (
                <div className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 w-full max-w-sm justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                  Último: <span className="font-mono">{lastMobileScan}</span>
                </div>
              )}

              <p className="text-xs text-muted-foreground text-center">
                Apuntá la cámara al código de barras. Se agrega al carrito automáticamente.
              </p>
            </>
          ) : (
            // Desktop: QR para abrir en celular
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

              <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full w-full max-w-sm justify-center
                ${lastScan
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'}`}>
                {lastScan
                  ? <><CheckCircle2 className="h-4 w-4" />Último scan: <span className="font-mono">{lastScan}</span></>
                  : <><Wifi className="h-4 w-4" />Esperando scans...</>
                }
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Podés cerrar este panel — el escáner sigue activo mientras estés en el POS.
              </p>
            </>
          )}

          <Button variant="outline" className="w-full max-w-sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
