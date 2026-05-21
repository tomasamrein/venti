'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mb-4">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </div>
      <h2 className="text-[20px] font-extrabold tracking-tight mb-1">Algo salió mal</h2>
      <p className="text-[14px] text-muted-foreground mb-6 max-w-sm">
        Ocurrió un error inesperado. Podés intentar recargar la página.
      </p>
      <Button onClick={reset} className="gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700">
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  )
}
