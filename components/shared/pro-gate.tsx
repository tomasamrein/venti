import Link from 'next/link'
import { Lock } from 'lucide-react'
import { isBusinessTier } from '@/lib/utils/plan'

interface ProGateProps {
  children: React.ReactNode
  planType: string
  orgSlug: string
}

export function ProGate({ children, planType, orgSlug }: ProGateProps) {
  if (isBusinessTier(planType)) return <>{children}</>
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Lock className="h-6 w-6 text-slate-400" />
      </div>
      <div>
        <p className="text-[15px] font-semibold">Función exclusiva del plan Avanzado</p>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-xs">
          Actualizá tu plan para acceder a esta funcionalidad.
        </p>
      </div>
      <Link
        href={`/${orgSlug}/configuracion/suscripcion`}
        className="h-9 px-5 rounded-xl text-[13px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors inline-flex items-center"
      >
        Ver planes
      </Link>
    </div>
  )
}
