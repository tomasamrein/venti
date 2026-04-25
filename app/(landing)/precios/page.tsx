'use client'

import { useState } from 'react'
import { Check, Zap, ChevronRight, Loader2, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const BASIC_FEATURES = [
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

const PRO_EXTRAS = [
  'Todo lo de Basic',
  'Sucursales ilimitadas',
  'Dashboard consolidado multi-sucursal',
  'Reportes comparativos por sucursal',
  'Notificaciones push',
  'Soporte prioritario',
]

export default function PreciosPage() {
  const [loading, setLoading] = useState<'basic' | 'pro' | null>(null)

  async function handleCheckout(plan: 'basic' | 'pro') {
    const email = window.prompt('Ingresá tu email para continuar con el pago:')
    if (!email?.includes('@')) {
      if (email !== null) toast.error('Email inválido')
      return
    }

    setLoading(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: plan, email }),
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
          14 días de prueba gratis en cualquier plan. Sin tarjeta de crédito. Cancelás cuando querés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
        {/* Basic */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 flex flex-col gap-6">
          <div>
            <p className="text-[14px] font-bold text-white">Basic</p>
            <p className="text-[13px] text-[#5a6480] mt-0.5">Para negocios con una sola sucursal.</p>
            <div className="flex items-baseline gap-1.5 mt-5">
              <span className="text-[44px] font-extrabold tracking-tight text-white">{fmt(49999)}</span>
            </div>
            <p className="text-[12px] text-[#5a6480] mt-0.5">por mes</p>
          </div>
          <ul className="space-y-2.5 flex-1">
            {BASIC_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#8891a8]">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <button
              onClick={() => handleCheckout('basic')}
              disabled={loading === 'basic'}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-semibold border border-white/[0.12] text-white hover:bg-white/5 transition-colors disabled:opacity-60"
            >
              {loading === 'basic' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {loading === 'basic' ? 'Redirigiendo...' : 'Suscribirse con Mercado Pago'}
            </button>
            <Link
              href="/registro?plan=basic"
              className="w-full inline-flex items-center justify-center gap-1 h-9 rounded-xl text-[13px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Empezar gratis 14 días <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Pro */}
        <div className="relative rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.07] to-transparent p-7 flex flex-col gap-6">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1">
              <Zap className="h-3 w-3" /> Multi-sucursal
            </span>
          </div>
          <div>
            <p className="text-[14px] font-bold text-white">Pro</p>
            <p className="text-[13px] text-[#5a6480] mt-0.5">Para cadenas y múltiples puntos de venta.</p>
            <div className="flex items-baseline gap-1.5 mt-5">
              <span className="text-[44px] font-extrabold tracking-tight text-white">{fmt(49999)}</span>
            </div>
            <p className="text-[12px] text-[#5a6480] mt-0.5">por sucursal / mes</p>
          </div>
          <ul className="space-y-2.5 flex-1">
            {PRO_EXTRAS.map(f => (
              <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#8891a8]">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <button
              onClick={() => handleCheckout('pro')}
              disabled={loading === 'pro'}
              className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.48 0.25 145))' }}
            >
              {loading === 'pro' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              {loading === 'pro' ? 'Redirigiendo...' : 'Suscribirse con Mercado Pago'}
            </button>
            <Link
              href="/registro?plan=pro"
              className="w-full inline-flex items-center justify-center gap-1 h-9 rounded-xl text-[13px] text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Empezar gratis 14 días <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* MP note */}
      <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 max-w-3xl mx-auto">
        <p className="text-[13px] font-semibold text-white mb-1">Pagás con Mercado Pago</p>
        <p className="text-[12px] text-[#5a6480] leading-relaxed">
          Tarjeta de débito, crédito o transferencia bancaria. Se cobra mensual de forma automática.
          Podés cancelar desde tu cuenta en Venti en cualquier momento, sin permanencia ni penalidades.
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
                <th className="px-5 py-3 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Basic</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Pro</th>
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
              ].map(([feat, basic, pro]) => (
                <tr key={String(feat)} className="hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-[#8891a8]">{feat}</td>
                  <td className="px-5 py-3 text-center">
                    {basic === true ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : basic === false ? <span className="text-[#3d4560]">—</span> : <span className="text-white font-medium">{basic}</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {pro === true ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : pro === false ? <span className="text-[#3d4560]">—</span> : <span className="text-emerald-400 font-medium">{pro}</span>}
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
