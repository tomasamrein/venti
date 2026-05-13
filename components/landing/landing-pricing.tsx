'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Calendar, Tag, Zap, Package, Rocket } from 'lucide-react'
import { AnimateIn } from '@/components/landing/animate-in'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const PLANS = [
  {
    name: 'Simple',
    icon: Zap,
    pricePromo: 30000,
    priceFull: 60000,
    priceAnnual: 270000,
    priceLabel: null as string | null,
    features: ['Cobros con escáner de barras', 'Stock con alertas automáticas', 'Clientes y cuentas corrientes', 'Export de ventas para tu contador', 'Funciona sin internet', 'Chatbot de soporte con IA'],
    cta: 'Empezar gratis 14 días',
    href: '/registro',
    highlight: false,
  },
  {
    name: 'Con Facturación',
    icon: Package,
    pricePromo: 50000,
    priceFull: 100000,
    priceAnnual: 450000,
    priceLabel: null as string | null,
    features: ['Todo lo del plan Simple', 'Facturación AFIP (A, B y C) con CAE', 'Reportes de ventas y caja', 'Gestión de proveedores', 'Actualización masiva de precios', 'Historial de cambios de precio'],
    cta: 'Suscribirme',
    href: '/registro',
    highlight: true,
  },
  {
    name: 'Profesional',
    icon: Rocket,
    pricePromo: null as number | null,
    priceFull: null as number | null,
    priceAnnual: null as number | null,
    priceLabel: 'A consultar' as string | null,
    features: ['Todo lo del plan Con Facturación', 'Multi-sucursal con stock independiente', 'Usuarios ilimitados', 'Reportes por sucursal y cajero', 'Integración personalizada', 'Soporte prioritario'],
    cta: 'Hablar con ventas',
    href: '/#contacto',
    highlight: false,
  },
]

export function LandingPricing() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <>
      <AnimateIn className="text-center space-y-3">
        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center justify-center gap-2">
          <span className="w-8 h-px bg-emerald-300" />Precios<span className="w-8 h-px bg-emerald-300" />
        </p>
        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Planes simples, sin sorpresas</h2>

        {/* Billing toggle */}
        <div className="flex items-center justify-center pt-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-sm font-medium">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-lg transition-colors ${billing === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Mensual
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-lg transition-colors flex items-center gap-2 ${billing === 'annual' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Anual
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                -25%
              </span>
            </button>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
          <Tag className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-xs font-bold text-amber-700">Precio de lanzamiento: 50% off los primeros 3 meses</span>
        </div>
      </AnimateIn>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {PLANS.map((plan, i) => {
          const Icon = plan.icon
          return (
            <AnimateIn key={plan.name} delay={i * 100}>
              <div className={`relative rounded-3xl border p-7 flex flex-col gap-6 bg-white h-full ${
                plan.highlight
                  ? 'border-emerald-400 shadow-xl shadow-emerald-100 ring-1 ring-emerald-300/50'
                  : 'border-slate-200 shadow-sm'
              }`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm">
                      Más elegido
                    </span>
                  </div>
                )}
                <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-base font-black text-slate-900">{plan.name}</p>
                  {plan.priceLabel ? (
                    <div className="mt-3">
                      <span className="text-2xl font-black text-slate-900">A consultar</span>
                      <p className="text-xs text-slate-500 mt-1.5">El precio se define según tu negocio, facturación y cantidad de sucursales. Hablanos por WhatsApp.</p>
                    </div>
                  ) : billing === 'annual' ? (
                    <div>
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900">{fmt(plan.priceAnnual!)}</span>
                        <span className="text-sm text-slate-500 font-medium">/año</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{fmt(Math.round(plan.priceAnnual! / 12))}/mes · ahorrás {fmt(plan.pricePromo! * 12 - plan.priceAnnual!)}</p>
                      <p className="text-[11px] text-slate-400 mt-1 line-through">{fmt(plan.pricePromo! * 12)}/año</p>
                    </div>
                  ) : (
                    <div>
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-slate-900">{fmt(plan.pricePromo!)}</span>
                        <span className="text-sm text-slate-500 font-medium">/mes</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">los primeros 3 meses</p>
                      <p className="text-[11px] text-slate-500 mt-2">
                        Después <span className="font-semibold text-slate-700">{fmt(plan.priceFull!)}/mes</span>
                      </p>
                    </div>
                  )}
                </div>
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold transition-all ${
                    plan.highlight
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-200'
                      : 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {plan.cta} <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </AnimateIn>
          )
        })}
      </div>
    </>
  )
}
