'use client'

import { WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 text-center bg-background">
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
        <WifiOff className="w-10 h-10 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Sin conexión</h1>
        <p className="text-muted-foreground max-w-sm">
          No hay conexión a internet. Algunas funciones del POS siguen disponibles.
        </p>
      </div>
      <Button onClick={() => window.location.reload()} variant="outline">
        Reintentar
      </Button>
    </div>
  )
}
