import { WifiOff } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070910]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto">
          <WifiOff className="h-8 w-8 text-amber-400" />
        </div>
        <h1 className="text-[24px] font-extrabold tracking-[-0.03em] text-white">Sin conexión</h1>
        <p className="text-[14px] text-[#5a6480] max-w-xs">
          No se pudo conectar. Revisá tu conexión a internet e intentá de nuevo.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-4 px-5 h-10 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}
        >
          Reintentar
        </Link>
      </div>
    </div>
  )
}
