'use client'

import { useEffect } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { formatARS } from '@/lib/utils/currency'

interface Props {
  phone: string
  invoiceNumber: string
  total: number
  orgName: string
  invoiceUrl?: string
  onClose: () => void
}

export function WhatsAppShare({ phone, invoiceNumber, total, orgName, invoiceUrl, onClose }: Props) {
  const message = invoiceUrl
    ? `Hola! Te compartimos tu comprobante N° ${invoiceNumber} de ${orgName} por ${formatARS(total)}.\n\nPodés verlo aquí: ${invoiceUrl}`
    : `Hola! Tu comprobante N° ${invoiceNumber} de ${orgName} por ${formatARS(total)} fue emitido correctamente.`

  const cleanPhone = phone.replace(/\D/g, '')
  const waUrl = `https://wa.me/${cleanPhone.startsWith('54') ? cleanPhone : `54${cleanPhone}`}?text=${encodeURIComponent(message)}`

  function handleOpen() {
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Compartir por WhatsApp</DialogTitle>
          <DialogDescription>
            Se abrirá WhatsApp con el mensaje listo para enviar al cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 rounded-xl bg-muted/40 text-sm whitespace-pre-line leading-relaxed">
          {message}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 rounded-xl bg-[#25D366] hover:bg-[#1da855] text-white gap-2"
            onClick={handleOpen}
          >
            <MessageCircle className="h-4 w-4" />
            Abrir WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
