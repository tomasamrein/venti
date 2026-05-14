'use client'

import type React from 'react'
import { useState } from 'react'
import { Check, ChevronRight, Smartphone, Zap, Package, Tag, Rocket, MessageCircle, Calendar } from 'lucide-react'
import Link from 'next/link'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

type Plan = {
  name: string
  icon: React.ElementType
  pricePromo: number | null
  priceFull: number | null
  priceAnnual: number | null
  features: string[]
  cta: string
  href: string
  highlight: boolean
  contact: boolean
}

const PLANS: Plan[] = [
  {
    name: 'Simple',
    icon: Zap,
    pricePromo: 30000,
    priceFull: 60000,
    priceAnnual: 270000,
    features: [
      'POS con escáner de barras USB y cámara',
      'Gestión de productos y stock',
      'Alertas automáticas de stock bajo',
      'Clientes y cuentas corrientes (fiado)',
      'Export de ventas del mes para tu contador',
      'Funciona offline',
      'Chatbot de soporte con IA',
      'Soporte por WhatsApp',
    ],
    cta: 'Empezar gratis 14 días',
    href: '/registro',
    highlight: false,
    contact: false,
  },
  {
    name: 'Con Facturación',
    icon: Package,
    pricePromo: 50000,
    priceFull: 100000,
    priceAnnual: 450000,
    features: [
      'Todo lo del plan Simple',
      'Facturación ARCA (A, B y C) con CAE',
      'Reportes de ventas, stock y caja',
      'Gestión de proveedores',
      'Actualización masiva de precios',
      'Historial de cambios de precio',
      'Export CSV y Excel',
    ],
    cta: 'Suscribirme',
    href: '/registro',
    highlight: true,
    contact: false,
  },
  {
    name: 'Profesional',
    icon: Rocket,
    pricePromo: null,
    priceFull: null,
    priceAnnual: null,
    features: [
      'Todo lo del plan Con Facturación',
      'Multi-sucursal con stock independiente',
      'Multi-usuario sin límite',
      'Reportes por sucursal y cajero',
      'Integración personalizada',
      'Soporte prioritario',
    ],
    cta: 'Hablar con ventas',
    href: '/#contacto',
    highlight: false,
    contact: true,
  },
]

const COMPARISON: [string, boolean, boolean, boolean][] = [
  ['POS con escáner de barras',            true,  true,  true ],
  ['Stock y alertas automáticas',          true,  true,  true ],
  ['Clientes y cuentas corrientes',        true,  true,  true ],
  ['Export de ventas para contador',       true,  true,  true ],
  ['Funciona offline',                     true,  true,  true ],
  ['Chatbot IA + soporte WhatsApp',        true,  true,  true ],
  ['Facturación ARCA (A, B y C)',          false, true,  true ],
  ['Reportes avanzados',                   false, true,  true ],
  ['Gestión de proveedores',               false, true,  true ],
  ['Historial de precios',                 false, true,  true ],
  ['Multi-sucursal',                       false, false, true ],
  ['Multi-usuario sin límite',             false, false, true ],
]

export default function PreciosPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          Planes y precios
        </h1>
        <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
          Probá cualquier plan gratis 14 días. Sin tarjeta de crédito.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center mb-8">
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

      {/* Promo banner */}
      <div className="mb-10 max-w-xl mx-auto">
        <div className="flex items-center justify-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3">
          <Tag className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-800 font-medium text-center">
            <span className="font-bold">50% off por tiempo limitado</span> — Solo para los primeros 30 clientes
          </p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {PLANS.map(plan => {
          const Icon = plan.icon
          return (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-6 flex flex-col gap-5 bg-white ${
                plan.highlight ? 'border-emerald-400 shadow-md shadow-emerald-100' : 'border-slate-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white whitespace-nowrap">
                    Más popular
                  </span>
                </div>
              )}
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{plan.name}</p>
                {plan.contact ? (
                  <div className="mt-3">
                    <span className="text-2xl font-bold text-slate-900">A consultar</span>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      El precio se define según la cantidad de sucursales y necesidades de tu negocio.
                    </p>
                  </div>
                ) : billing === 'annual' ? (
                  <>
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-3xl font-bold tracking-tight text-slate-900">{fmt(plan.priceAnnual!)}</span>
                      <span className="text-sm text-slate-400">/año</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-slate-400 line-through">{fmt(plan.pricePromo! * 12)}/año</span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        ahorrás {fmt(plan.pricePromo! * 12 - plan.priceAnnual!)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{fmt(Math.round(plan.priceAnnual! / 12))}/mes</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 mt-3">
                      <span className="text-3xl font-bold tracking-tight text-slate-900">{fmt(plan.pricePromo!)}</span>
                      <span className="text-sm text-slate-400">/mes</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-slate-400 line-through">{fmt(plan.priceFull!)}/mes</span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        50% off por tiempo limitado
                      </span>
                    </div>
                  </>
                )}
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : plan.contact
                      ? 'bg-slate-800 text-white hover:bg-slate-900'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {plan.contact ? <MessageCircle className="h-4 w-4" /> : null}
                {plan.cta}
                {!plan.contact && <ChevronRight className="h-4 w-4" />}
              </Link>
            </div>
          )
        })}
      </div>

      {/* MP note */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 max-w-3xl mx-auto flex items-center gap-4">
        <Smartphone className="h-8 w-8 text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-0.5">Pagás con Mercado Pago</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tarjeta de débito, crédito o transferencia bancaria. Se cobra mensual de forma automática.
            Oferta por tiempo limitado para los primeros 30 clientes. Luego pasa al precio regular.
            Podés cancelar desde tu cuenta en Ventix en cualquier momento, sin permanencia ni penalidades.
          </p>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="mt-16 max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">¿Qué incluye cada plan?</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Funcionalidad</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Simple</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Con Facturación</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Profesional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON.map(([feat, simple, facturacion, pro]) => (
                <tr key={feat} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 text-xs">{feat}</td>
                  {[simple, facturacion, pro].map((val, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      {val
                        ? <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                        : <span className="text-slate-200 font-bold text-lg leading-none">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
