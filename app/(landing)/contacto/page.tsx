import type { Metadata } from 'next'
import { MessageCircle, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contactanos por WhatsApp o email. Soporte para Venti.',
}

export default function ContactoPage() {
  const PHONE = '5493437479134'
  const EMAIL = 'hola@venti.ar'

  return (
    <div className="max-w-2xl mx-auto px-4 py-24">
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          ¿Necesitás ayuda?
        </h1>
        <p className="mt-4 text-base text-slate-600">
          Respondemos rápido. Sin formularios, sin tickets.
        </p>
      </div>

      <div className="space-y-4">
        <a
          href={`https://wa.me/${PHONE}?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Venti`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-5 rounded-xl border border-emerald-200 bg-emerald-50 p-6 hover:bg-emerald-100 hover:border-emerald-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <MessageCircle className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-slate-900">WhatsApp</p>
            <p className="text-sm text-slate-600 mt-0.5">
              La forma más rápida. Respondemos en minutos en horario de atención.
            </p>
          </div>
          <span className="text-sm font-semibold text-emerald-700 group-hover:text-emerald-800 transition-colors">
            Escribir →
          </span>
        </a>

        <a
          href={`mailto:${EMAIL}`}
          className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 hover:bg-slate-50 hover:border-slate-300 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Mail className="h-6 w-6 text-slate-500" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-slate-900">Email</p>
            <p className="text-sm text-slate-600 mt-0.5">{EMAIL}</p>
          </div>
          <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-700 transition-colors">
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
            <p className="text-sm text-slate-400 mt-0.5">Urgencias fuera de horario también atendidas por WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm text-slate-600">
          Si tenés un negocio y querés ver Venti en acción,{' '}
          <a
            href={`https://wa.me/${PHONE}?text=Quiero%20una%20demo%20de%20Venti`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 hover:text-emerald-800 font-medium underline underline-offset-2"
          >
            pedinos una demo por WhatsApp
          </a>
          .
        </p>
      </div>
    </div>
  )
}
