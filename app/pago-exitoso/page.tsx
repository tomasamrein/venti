import Link from 'next/link'
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Pago exitoso — Ventix',
  description: 'Tu pago fue procesado correctamente. Bienvenido a Ventix.',
}

export default function PagoExitosoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Ícono de éxito */}
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

        {/* Mensaje principal */}
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

        {/* Steps de onboarding */}
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

        {/* CTA */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 w-full justify-center"
          >
            Ir al panel <ArrowRight className="h-4 w-4" />
          </Link>
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
