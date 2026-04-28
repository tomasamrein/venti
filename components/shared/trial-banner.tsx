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
    ? 'Hola%2C+mi+prueba+de+Venti+venció+y+quiero+continuar+usando+el+sistema.'
    : `Hola%2C+mi+prueba+de+Venti+vence+en+${daysLeft}+d%C3%ADa${daysLeft === 1 ? '' : 's'}+y+quiero+suscribirme.`
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 text-[13px] ${
      expired ? 'bg-red-950/80 border-b border-red-800/60 text-red-200' : 'bg-amber-950/80 border-b border-amber-800/60 text-amber-200'
    }`}>
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="flex-1">
        {expired
          ? 'Tu período de prueba venció.'
          : `Tu período de prueba vence en ${daysLeft} día${daysLeft === 1 ? '' : 's'}.`}
        {' '}Para seguir usando Venti,{' '}
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
        className="p-1 rounded hover:bg-white/10 transition-colors shrink-0"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
