'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, ArrowRight, Sparkles, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function PagoExitosoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  const orgSlugParam = searchParams.get('external_reference')

  useEffect(() => {
    async function resolveRedirect() {
      if (orgSlugParam) {
        setRedirectTo(`/${orgSlugParam}/dashboard`)
        return
      }
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setRedirectTo('/login'); return }
      const { data } = await supabase
        .from('organization_members')
        .select('organizations(slug)')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .limit(1)
        .single()
      const slug = (data?.organizations as { slug: string } | null)?.slug
      setRedirectTo(slug ? `/${slug}/dashboard` : '/login')
    }
    resolveRedirect()
  }, [orgSlugParam])

  useEffect(() => {
    if (!redirectTo) return
    if (countdown <= 0) { router.push(redirectTo); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown, redirectTo, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">

        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
              <Sparkles className="h-4 w-4 text-amber-900" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-[32px] font-extrabold tracking-[-0.03em] text-slate-900">
            ¡Pago exitoso!
          </h1>
          <p className="text-[18px] font-semibold text-emerald-600">
            Bienvenido a Ventix 🎉
          </p>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-sm mx-auto">
            Tu suscripción fue activada correctamente. Ya podés empezar a usar todas las funciones de tu plan.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-left space-y-3 shadow-sm">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-4">Próximos pasos</p>
          {[
            { n: '1', text: 'Cargá tus productos desde la sección Productos' },
            { n: '2', text: 'Abrí tu primera caja en el módulo Caja' },
            { n: '3', text: 'Empezá a vender desde el Punto de Venta' },
          ].map(step => (
            <div key={step.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                {step.n}
              </div>
              <p className="text-[14px] text-slate-700">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            href={redirectTo ?? '#'}
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 w-full justify-center"
          >
            Ir al panel <ArrowRight className="h-4 w-4" />
          </Link>

          <div className="flex items-center justify-center gap-1.5 text-[12px] text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{redirectTo ? `Redirigiendo automáticamente en ${countdown}s…` : 'Preparando redirección…'}</span>
          </div>

          <p className="text-[12px] text-slate-400">
            Si tuviste algún problema, escribinos a{' '}
            <a href="mailto:soporte@ventix.ar" className="text-emerald-600 hover:underline font-semibold">
              soporte@ventix.ar
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
