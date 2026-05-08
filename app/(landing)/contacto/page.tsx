import type { Metadata } from 'next'
import { Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contactanos por email. Soporte para Ventix.',
}

export default function ContactoPage() {
  const EMAIL = 'contacto@ventix.com.ar'

  return (
    <div className="max-w-2xl mx-auto px-4 py-24">
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          ¿Necesitás ayuda?
        </h1>
        <p className="mt-4 text-base text-slate-600">
          Escribinos y te respondemos a la brevedad.
        </p>
      </div>

      <div className="space-y-4">
        <a
          href={`mailto:${EMAIL}`}
          className="flex items-center gap-5 rounded-xl border border-emerald-200 bg-emerald-50 p-6 hover:bg-emerald-100 hover:border-emerald-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Mail className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-slate-900">Correo electrónico</p>
            <p className="text-sm text-slate-600 mt-0.5">{EMAIL}</p>
          </div>
          <span className="text-sm font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
            Escribir →
          </span>
        </a>

        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-slate-500" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-900">Horario de atención</p>
            <p className="text-sm text-slate-600 mt-0.5">Lunes a viernes de 9 a 18 hs (Argentina)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
