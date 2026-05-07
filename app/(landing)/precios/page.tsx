'use client'

import { Check, ChevronRight, Smartphone, Zap, Package, Star, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const WA_PERSONALIZADO = 'https://wa.me/5492604000000?text=Hola%2C+me+interesa+Ventix+para+mi+negocio+y+quiero+saber+si+tienen+soporte+para+mi+rubro.'

const PLANS = [
  {
    name: 'Inicio',
    icon: Zap,
    price: 50000,
    recommended: 'Kioscos',
    features: [
      'POS optimizado para lector de barras',
      'Stock con alertas automáticas',
      'Facturación ARCA (A, B y C)',
      'Clientes y cuentas corrientes',
      'Proveedores',
      'Reportes y dashboard',
      'Export CSV y Excel',
      'Funciona offline',
      'Soporte por WhatsApp',
    ],
    cta: 'Empezar gratis 14 días',
    href: '/registro',
    highlight: false,
    wa: false,
  },
  {
    name: 'Estándar',
    icon: Package,
    price: 50000,
    recommended: 'Almacenes, autoservicios y fotocopiadoras',
    features: [
      'Todo lo del plan Inicio',
      'Gestión de proveedores avanzada',
      'Venta por peso y unidades',
      'Módulo de servicios (imprenta, etc.)',
      'Actualización masiva de precios',
      'Historial de precios',
    ],
    cta: 'Empezar gratis 14 días',
    href: '/registro',
    highlight: false,
    wa: false,
  },
  {
    name: 'Pro',
    icon: Star,
    price: 80000,
    recommended: 'Drugstores y comercios 24hs',
    features: [
      'Todo lo del plan Estándar',
      'Selector de cajero por turno',
      'Historial de ventas por empleado',
      'Notificaciones push de stock',
      'Soporte prioritario',
      'Onboarding asistido',
    ],
    cta: 'Empezar gratis 14 días',
    href: '/registro',
    highlight: true,
    wa: false,
  },
  {
    name: 'A medida',
    icon: MessageCircle,
    price: null,
    recommended: 'Negocios con necesidades específicas',
    features: [
      'Todas las funciones base',
      'Módulos a medida de tu negocio',
      'Precio según complejidad',
      'Implementación asistida',
      'Soporte dedicado',
    ],
    cta: 'Consultar por WhatsApp',
    href: WA_PERSONALIZADO,
    highlight: false,
    wa: true,
  },
]

const COMPARISON: [string, boolean, boolean, boolean][] = [
  ['POS con escáner de barras',         true,  true,  true ],
  ['Facturación ARCA (A, B, C)',         true,  true,  true ],
  ['Stock y alertas automáticas',        true,  true,  true ],
  ['Clientes y cuentas corrientes',      true,  true,  true ],
  ['Reportes y dashboard',               true,  true,  true ],
  ['Modo offline',                       true,  true,  true ],
  ['Gestión de proveedores',             false, true,  true ],
  ['Historial de precios',               false, true,  true ],
  ['Módulo de servicios (imprenta)',      false, true,  true ],
  ['Selector de cajero por turno',       false, false, true ],
  ['Notificaciones push',                false, false, true ],
  ['Onboarding asistido',                false, false, true ],
]

export default function PreciosPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          Planes y precios
        </h1>
        <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
          14 días de prueba gratis en todos los planes. Sin tarjeta de crédito.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
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
                    Más completo
                  </span>
                </div>
              )}
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{plan.name}</p>
                <p className="text-xs text-emerald-700 font-medium mt-0.5 leading-snug">
                  Recomendado para: {plan.recommended}
                </p>
                <div className="flex items-baseline gap-1 mt-4">
                  {plan.price !== null ? (
                    <>
                      <span className="text-3xl font-bold tracking-tight text-slate-900">{fmt(plan.price)}</span>
                      <span className="text-sm text-slate-400">/mes</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold text-slate-700">A consultar</span>
                  )}
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>
              <div>
                <a
                  href={plan.href}
                  target={plan.wa ? '_blank' : undefined}
                  rel={plan.wa ? 'noopener noreferrer' : undefined}
                  className={`w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-semibold transition-colors ${
                    plan.wa
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : plan.highlight
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {plan.wa && (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.025.503 3.94 1.386 5.619L0 24l6.545-1.371A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.49-5.19-1.352l-.37-.216-3.885.813.827-3.789-.24-.388A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                  )}
                  {plan.cta} {!plan.wa && <ChevronRight className="h-4 w-4" />}
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* MP note */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 max-w-4xl mx-auto flex items-center gap-4">
        <Smartphone className="h-8 w-8 text-slate-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-slate-800 mb-0.5">Pagás con Mercado Pago</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tarjeta de débito, crédito o transferencia bancaria. Se cobra mensual de forma automática.
            Podés cancelar desde tu cuenta en Ventix en cualquier momento, sin permanencia ni penalidades.
          </p>
        </div>
      </div>

      {/* Feature comparison */}
      <div className="mt-16 max-w-4xl mx-auto">
        <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">¿Qué incluye cada plan?</h2>
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Funcionalidad</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Inicio</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Estándar</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-emerald-700 uppercase tracking-wider">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {COMPARISON.map(([feat, inicio, estandar, pro]) => (
                <tr key={feat} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-700 text-xs">{feat}</td>
                  {[inicio, estandar, pro].map((val, i) => (
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
        <p className="text-center text-xs text-slate-400 mt-3">El plan A medida incluye todas las funciones del plan Pro más módulos personalizados.</p>
      </div>
    </div>
  )
}
