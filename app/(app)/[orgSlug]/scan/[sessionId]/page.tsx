'use client'

import { useState, useEffect, useRef, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Scan, CheckCircle2, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  params: Promise<{ orgSlug: string; sessionId: string }>
}

export default function RemoteScanPage({ params }: Props) {
  const { sessionId } = use(params)
  const [scanning, setScanning] = useState(false)
  const [scans, setScans] = useState<{ code: string; ts: number }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`scanner:${sessionId}`).subscribe()
    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [sessionId])

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
          await channelRef.current.send({
            type: 'broadcast',
            event: 'scan',
            payload: { barcode: code },
          })
          setScans(prev => [{ code, ts: Date.now() }, ...prev.slice(0, 9)])
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
    <div className="flex flex-col items-center gap-4 p-4 max-w-sm mx-auto min-h-[calc(100vh-3.5rem)]">
      <div className="text-center pt-2">
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
