'use client'

import { WifiOff, Loader2, CloudUpload } from 'lucide-react'
import { useOfflineState, useServiceWorker } from '@/hooks/use-offline'

export function OfflineBanner() {
  useServiceWorker()
  const { isOffline, pendingCount, isSyncing } = useOfflineState()

  if (!isOffline && !isSyncing && pendingCount === 0) return null

  if (isOffline) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-xl text-amber-300 text-[13px] font-medium shadow-lg">
        <WifiOff className="h-4 w-4 shrink-0" />
        Sin conexión
        {pendingCount > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/30 text-[11px] font-bold">
            {pendingCount} {pendingCount === 1 ? 'cambio' : 'cambios'} en cola
          </span>
        )}
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/40 backdrop-blur-xl text-sky-300 text-[13px] font-medium shadow-lg">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        Sincronizando {pendingCount > 0 ? `${pendingCount} ${pendingCount === 1 ? 'cambio' : 'cambios'}…` : '…'}
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 backdrop-blur-xl text-amber-300 text-[13px] font-medium shadow-lg">
      <CloudUpload className="h-4 w-4 shrink-0" />
      {pendingCount} {pendingCount === 1 ? 'cambio pendiente' : 'cambios pendientes'} de sincronizar
    </div>
  )
}
