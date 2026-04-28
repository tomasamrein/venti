'use client'

import { useState } from 'react'
import { Check, Zap, ChevronRight, Loader2, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const SINGLE_FEATURES = [
  '1 sucursal',
  'Usuarios ilimitados',
  'POS con escáner de barras',
  'Facturación ARCA (A, B y C)',
  'Stock con alertas automáticas',
  'Actualización masiva de precios',
  'Clientes y cuentas corrientes',
  'Proveedores',
  'Reportes y dashboard',
  'Export CSV y Excel',
  'Funciona sin internet (offline)',
  'Soporte por WhatsApp',
]

const ENTERPRISE_EXTRAS = [
  'Todo lo de Single',
  'Sucursales ilimitadas',
  'Dashboard consolidado multi-sucursal',
  'Reportes comparativos por sucursal',
  'Notificaciones push',
  'Soporte prioritario',
  'Onboarding e implementación asistida',
]

const WHATSAPP_URL = 'https://wa.me/5492604000000?text=Hola%2C+quiero+info+sobre+el+plan+Enterprise+de+Venti'

export default function PreciosPage() {
  const [loading, setLoading] = useState<'basic' | null>(null)

  async function handleCheckout() {
    const email = window.prompt('Ingresá tu email para continuar con el pago:')
    if (!email?.includes('@')) {
      if (email !== null) toast.error('Email inválido')
      return
    }

    setLoading('basic')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: 'basic', email }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error al iniciar el pago'); return }
      window.location.href = json.init_point
    } catch {
      toast.error('Error de red')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <h1 className="text-[42px] md:text-[56px] font-extrabold tracking-[-0.04em] text-white">
          Planes y precios
        </h1>
        <p className="mt-4 text-[16px] text-[#5a6480] max-w-xl mx-auto">
          7 días de prueba gratis en el plan Single. Sin tarjeta de crédito. Cancelás cuando querés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {/* Single */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col gap-6">
          <div>
            <p className="text-[14px] font-bold text-white">Single</p>
            <p className="text-[13px] text-[#5a6480] mt-0.5">Para negocios con una sola sucursal.</p>
            <div className="flex items-baseline gap-1.5 mt-5">
              <span className="text-[44px] font-extrabold tracking-tight text-white">{fmt(49999)}</span>
            </div>
            <p className="text-[12px] text-[#5a6480] mt-0.5">por mes</p>
          </div>
          <ul className="space-y-2.5 flex-1">
            {SINGLE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#8891a8]">
                <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <button
              onClick={handleCheckout}
              disabled={loading === 'basic'}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-semibold border border-white/[0.12] text-white hover:bg-white/5 transition-colors disabled:opacity-60"
            >
              {loading === 'basic' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {loading === 'basic' ? 'Redirigiendo...' : 'Suscribirse con Mercado Pago'}
            </button>
            <Link
              href="/registro?plan=basic"
              className="w-full inline-flex items-center justify-center gap-1 h-9 rounded-xl text-[13px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Empezar gratis 7 días <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Enterprise */}
        <div className="relative rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-indigo-500/[0.08] to-transparent p-7 flex flex-col gap-6">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-600 text-white flex items-center gap-1">
              <Zap className="h-3 w-3" /> Multi-sucursal
            </span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">Enterprise</p>
            <p className="text-[13px] text-[#5a6480] mt-0.5">Para cadenas y múltiples puntos de venta.</p>
            <div className="flex items-baseline gap-1.5 mt-5">
              <span className="text-[32px] font-extrabold tracking-tight text-indigo-300">A consultar</span>
            </div>
            <p className="text-[12px] text-[#5a6480] mt-0.5">precio por sucursal según escala</p>
          </div>
          <ul className="space-y-2.5 flex-1">
            {ENTERPRISE_EXTRAS.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#8891a8]">
                <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-semibold text-white transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }}
            >
              <CreditCard className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
            <p className="text-center text-[12px] text-[#5a6480] pt-1">
              Te respondemos en menos de 24 horas hábiles
            </p>
          </div>
        </div>
      </div>

      {/* MP note */}
      <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 max-w-3xl mx-auto">
        <p className="text-[13px] font-semibold text-white mb-1">Plan Single: pagás con Mercado Pago</p>
        <p className="text-[12px] text-[#5a6480] leading-relaxed">
          Tarjeta de débito, crédito o transferencia bancaria. Se cobra mensual de forma automática.
          Podés cancelar desde tu cuenta en Venti en cualquier momento, sin permanencia ni penalidades.
          El plan Enterprise se cotiza a medida según cantidad de sucursales.
        </p>
      </div>

      {/* Feature comparison */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-[22px] font-bold text-white mb-6 text-center">Comparativa completa</h2>
        <div className="rounded-xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Funcionalidad</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Single</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {[
                ['POS con escáner de barras', true, true],
                ['Facturación ARCA (A, B, C)', true, true],
                ['Stock y alertas automáticas', true, true],
                ['Clientes y cuentas corrientes', true, true],
                ['Reportes y dashboard', true, true],
                ['Export CSV y Excel', true, true],
                ['Modo offline', true, true],
                ['Número de sucursales', '1', 'Ilimitadas'],
                ['Dashboard multi-sucursal', false, true],
                ['Reportes comparativos', false, true],
                ['Notificaciones push', false, true],
                ['Soporte prioritario', false, true],
                ['Onboarding asistido', false, true],
              ].map(([feat, single, enterprise]) => (
                <tr key={String(feat)} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-[#8891a8]">{feat}</td>
                  <td className="px-5 py-3 text-center">
                    {single === true ? <Check className="h-4 w-4 text-indigo-400 mx-auto" /> : single === false ? <span className="text-[#3d4560]">—</span> : <span className="text-white font-medium">{single}</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {enterprise === true ? <Check className="h-4 w-4 text-indigo-400 mx-auto" /> : enterprise === false ? <span className="text-[#3d4560]">—</span> : <span className="text-indigo-400 font-medium">{enterprise}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
