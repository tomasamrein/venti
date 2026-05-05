'use client'

import { useState } from 'react'
import { Check, Zap, ChevronRight, Loader2, CreditCard, Smartphone } from 'lucide-react'
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
    // Redirect to login first — checkout needs an authenticated session to link the subscription
    window.location.href = '/login?redirect=/precios&checkout=basic'
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          Planes y precios
        </h1>
        <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
          7 días de prueba gratis en el plan Single. Sin tarjeta de crédito. Cancelás cuando querés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {/* Single */}
        <div className="rounded-xl border border-slate-200 bg-white p-7 flex flex-col gap-6">
          <div>
            <p className="text-sm font-bold text-slate-900">Single</p>
            <p className="text-sm text-slate-500 mt-0.5">Para negocios con una sola sucursal.</p>
            <div className="flex items-baseline gap-1.5 mt-5">
              <span className="text-4xl font-bold tracking-tight text-slate-900">{fmt(49999)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">por mes</p>
          </div>
          <ul className="space-y-2.5 flex-1">
            {SINGLE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <button
              onClick={handleCheckout}
              disabled={loading === 'basic'}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {loading === 'basic' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {loading === 'basic' ? 'Redirigiendo...' : 'Suscribirse con Mercado Pago'}
            </button>
            <Link
              href="/registro?plan=basic"
              className="w-full inline-flex items-center justify-center gap-1 h-9 rounded-lg text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              Empezar gratis 7 días <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Enterprise */}
        <div className="relative rounded-xl border border-emerald-300 bg-emerald-50 p-7 flex flex-col gap-6">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1">
              <Zap className="h-3 w-3" /> Multi-sucursal
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Enterprise</p>
            <p className="text-sm text-slate-600 mt-0.5">Para cadenas y múltiples puntos de venta.</p>
            <div className="flex items-baseline gap-1.5 mt-5">
              <span className="text-3xl font-bold tracking-tight text-emerald-700">A consultar</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">precio por sucursal según escala</p>
          </div>
          <ul className="space-y-2.5 flex-1">
            {ENTERPRISE_EXTRAS.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
            <p className="text-center text-xs text-slate-500 pt-1">
              Respondemos en menos de 24 horas hábiles
            </p>
          </div>
        </div>
      </div>

      {/* MP note */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 max-w-3xl mx-auto flex items-center gap-4">
        <Smartphone className="h-8 w-8 text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-0.5">Plan Single: pagás con Mercado Pago</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tarjeta de débito, crédito o transferencia bancaria. Se cobra mensual de forma automática.
            Podés cancelar desde tu cuenta en Venti en cualquier momento, sin permanencia ni penalidades.
          </p>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="mt-16 max-w-3xl mx-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Comparativa completa</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Funcionalidad</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Single</th>
                <th className="px-5 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Enterprise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {([
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
              ] as [string, boolean | string, boolean | string][]).map(([feat, single, enterprise]) => (
                <tr key={feat} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-700">{feat}</td>
                  <td className="px-5 py-3 text-center">
                    {single === true
                      ? <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                      : single === false
                        ? <span className="text-slate-300 font-bold">—</span>
                        : <span className="text-slate-800 font-medium">{single}</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {enterprise === true
                      ? <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                      : enterprise === false
                        ? <span className="text-slate-300 font-bold">—</span>
                        : <span className="text-emerald-700 font-semibold">{enterprise}</span>}
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
