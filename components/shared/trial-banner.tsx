'use client'

import { AlertTriangle, X, MessageCircle } from 'lucide-react'
import { useState } from 'react'

const WHATSAPP_NUMBER = '5492604000000' // reemplazar con tu número real

interface TrialBannerProps {
  trialEndsAt: string | null
  isActive: boolean
}

export function TrialBanner({ trialEndsAt, isActive }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const now = Date.now()
  const endsAt = trialEndsAt ? new Date(trialEndsAt).getTime() : null

  // No trial date set — not on trial
  if (!endsAt) return null

  const msLeft = endsAt - now
  const daysLeft = Math.ceil(msLeft / 86400000)

  const expired = msLeft <= 0
  const expiringSoon = daysLeft <= 2 && daysLeft > 0

  if (!expired && !expiringSoon) return null

  // Build WhatsApp link
  const msg = expired
    ? 'Hola%2C+mi+prueba+de+Ventix+venció+y+quiero+continuar+usando+el+sistema.'
    : `Hola%2C+mi+prueba+de+Ventix+vence+en+${daysLeft}+d%C3%ADa${daysLeft === 1 ? '' : 's'}+y+quiero+suscribirme.`
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-[13px] ${
      expired ? 'bg-red-50 border-b border-red-200 text-red-800' : 'bg-amber-50 border-b border-amber-200 text-amber-800'
    }`}>
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        {expired
          ? 'Tu período de prueba venció.'
          : `Tu período de prueba vence en ${daysLeft} día${daysLeft === 1 ? '' : 's'}.`}
        {' '}Para seguir usando Ventix,{' '}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2 hover:opacity-80 inline-flex items-center gap-1"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          escribinos por WhatsApp
        </a>
        .
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-black/5 transition-colors shrink-0"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
