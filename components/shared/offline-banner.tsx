'use client'

import { WifiOff } from 'lucide-react'
import { useOffline, useServiceWorker } from '@/hooks/use-offline'

export function OfflineBanner() {
  useServiceWorker()
  const isOffline = useOffline()

  if (!isOffline) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-xl text-amber-300 text-[13px] font-medium shadow-lg">
      <WifiOff className="h-4 w-4 shrink-0" />
      Sin conexión — los cambios se sincronizarán cuando vuelvas a conectarte
    </div>
  )
}
