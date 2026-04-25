import type { Metadata } from 'next'
import { MessageCircle, Mail, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contactanos por WhatsApp o email. Soporte para Venti.',
}

export default function ContactoPage() {
  const PHONE = '5492915000000' // reemplazar con número real
  const EMAIL = 'hola@venti.ar'

  return (
    <div className="max-w-2xl mx-auto px-4 py-24">
      <div className="text-center mb-14">
        <h1 className="text-[42px] md:text-[52px] font-extrabold tracking-[-0.04em] text-white">
          ¿Necesitás ayuda?
        </h1>
        <p className="mt-4 text-[16px] text-[#5a6480]">
          Respondemos rápido. Sin formularios, sin tickets.
        </p>
      </div>

      <div className="space-y-4">
        <a
          href={`https://wa.me/${PHONE}?text=Hola%2C%20quiero%20saber%20m%C3%A1s%20sobre%20Venti`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-6 hover:bg-emerald-500/[0.07] hover:border-emerald-500/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <MessageCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-white">WhatsApp</p>
            <p className="text-[13px] text-[#5a6480] mt-0.5">
              La forma más rápida. Respondemos en minutos en horario de atención.
            </p>
          </div>
          <span className="text-[13px] font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
            Escribir →
          </span>
        </a>

        <a
          href={`mailto:${EMAIL}`}
          className="flex items-center gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
            <Mail className="h-6 w-6 text-[#8891a8]" />
          </div>
          <div className="flex-1">
            <p className="text-[15px] font-bold text-white">Email</p>
            <p className="text-[13px] text-[#5a6480] mt-0.5">{EMAIL}</p>
          </div>
          <span className="text-[13px] font-semibold text-[#8891a8] group-hover:text-white transition-colors">
            Escribir →
          </span>
        </a>

        <div className="flex items-center gap-5 rounded-2xl border border-white/[0.05] bg-white/[0.01] p-6">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-[#5a6480]" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white">Horario de atención</p>
            <p className="text-[13px] text-[#5a6480] mt-0.5">Lunes a viernes de 9 a 18 hs (Argentina)</p>
            <p className="text-[12px] text-[#3d4560] mt-0.5">Urgencias fuera de horario también atendidas por WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-xl border border-white/[0.05] bg-white/[0.01] p-5 text-center">
        <p className="text-[13px] text-[#5a6480]">
          Si tenés un negocio y querés ver Venti en acción,{' '}
          <a
            href={`https://wa.me/${PHONE}?text=Quiero%20una%20demo%20de%20Venti`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
          >
            pedinos una demo por WhatsApp
          </a>
          .
        </p>
      </div>
    </div>
  )
}
