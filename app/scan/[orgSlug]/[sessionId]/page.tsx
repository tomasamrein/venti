'use client'

import { useState, useEffect, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Scan, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  params: Promise<{ orgSlug: string; sessionId: string }>
}

export default function PublicScanPage({ params }: Props) {
  const { sessionId } = use(params)
  const [scanning, setScanning] = useState(false)
  const [scans, setScans] = useState<{ code: string; ts: number }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)
  const lastScanRef = useRef<{ code: string; ts: number } | null>(null)
  const COOLDOWN_MS = 2500

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`scanner:${sessionId}`).subscribe()
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

  // Auto-start camera on mobile
  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) startCamera()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function startCamera() {
    if (!videoRef.current) return
    setScanning(true)
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        async (result) => {
          if (!result || !channelRef.current) return
          const code = result.getText()
          const now = Date.now()
          const last = lastScanRef.current
          if (last && last.code === code && now - last.ts < COOLDOWN_MS) return
          lastScanRef.current = { code, ts: now }
          await channelRef.current.send({
            type: 'broadcast',
            event: 'scan',
            payload: { barcode: code },
          })
          setScans(prev => [{ code, ts: now }, ...prev.slice(0, 9)])
          // Beep de confirmación
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
          toast.success(`Enviado: ${code}`, { duration: 1500 })
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

  useEffect(() => () => { controlsRef.current?.stop() }, [])

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-sm mx-auto min-h-dvh bg-background">
      <div className="text-center pt-4">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Scan className="h-5 w-5 text-emerald-600" />
          Escáner remoto
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Escaneá códigos — se agregan al carrito del POS en tiempo real
        </p>
      </div>

      <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black relative border border-border">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80">
            <Scan className="h-12 w-12 text-white/60" />
            <Button
              onClick={startCamera}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Iniciar cámara
            </Button>
          </div>
        )}
      </div>

      {scanning && (
        <Button variant="outline" onClick={stopCamera} className="w-full">
          Detener cámara
        </Button>
      )}

      {scans.length > 0 && (
        <div className="w-full space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Últimos scans enviados
          </p>
          {scans.map(s => (
            <div
              key={s.ts}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-mono text-sm flex-1">{s.code}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(s.ts).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
