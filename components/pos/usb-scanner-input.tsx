'use client'

import { useEffect, useRef, useState } from 'react'
import { ScanBarcode } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Props {
  open: boolean
  onScan: (barcode: string) => void
  onClose: () => void
}

export function UsbScannerInput({ open, onScan, onClose }: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && value.trim()) {
      onScan(value.trim())
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ScanBarcode className="h-4 w-4" /> Escáner USB / Código manual
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Apuntá el escáner USB acá o escribí el código y presioná Enter.
          </p>
          <Input
            ref={inputRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escanear o escribir código..."
            className="font-mono rounded-xl"
            autoComplete="off"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
