'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onScan: (barcode: string) => void
  onClose: () => void
}

export function CameraScanner({ open, onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    let active = true

    async function start() {
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      if (!videoRef.current || !active) return
      try {
        const controls = await new BrowserMultiFormatReader().decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result && active) {
              onScan(result.getText())
              onClose()
            }
          }
        )
        controlsRef.current = controls
      } catch {
        if (active) setError('No se pudo acceder a la cámara. Verificá los permisos.')
      }
    }

    start()
    return () => {
      active = false
      controlsRef.current?.stop()
      controlsRef.current = null
    }
  }, [open, onScan, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Camera className="h-4 w-4" /> Escanear código
          </DialogTitle>
        </DialogHeader>
        {error
          ? <p className="text-sm text-destructive text-center py-6">{error}</p>
          : <video ref={videoRef} className="w-full rounded-lg aspect-video object-cover bg-black" />
        }
      </DialogContent>
    </Dialog>
  )
}
