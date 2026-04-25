import Link from 'next/link'
import { Check } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Precios',
  description: 'Planes de Venti para tu negocio. Free Trial de 14 días, Basic y Pro.',
}

const PLANS = [
  {
    name: 'Free Trial',
    price: 0,
    period: '14 días',
    desc: 'Para conocer Venti sin compromiso.',
    features: [
      '1 sucursal',
      '2 usuarios',
      'POS completo con escáner',
      'Gestión de productos y stock',
      'Historial de ventas',
      'Clientes básico',
      'Reportes básicos',
    ],
    cta: 'Empezar gratis',
    href: '/registro',
    highlight: false,
  },
  {
    name: 'Basic',
    price: 15000,
    period: '/mes',
    desc: 'Para comercios que quieren crecer.',
    features: [
      '1 sucursal',
      '5 usuarios',
      'Todo el Free Trial',
      'Facturación ARCA (A, B, C)',
      'Cuentas corrientes',
      'Proveedores',
      'Export CSV y Excel',
      'Soporte prioritario',
    ],
    cta: 'Elegir Basic',
    href: '/registro?plan=basic',
    highlight: true,
  },
  {
    name: 'Pro',
    price: 35000,
    period: '/mes',
    desc: 'Para negocios con múltiples sucursales.',
    features: [
      'Sucursales ilimitadas',
      'Usuarios ilimitados',
      'Todo el Basic',
      'Reportes avanzados multi-sucursal',
      'Dashboard consolidado',
      'Notificaciones push',
      'API access',
    ],
    cta: 'Elegir Pro',
    href: '/registro?plan=pro',
    highlight: false,
  },
]

export default function PreciosPage() {
  const fmt = (n: number) =>
    n === 0 ? 'Gratis' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <h1 className="text-[42px] md:text-[56px] font-extrabold tracking-[-0.04em] text-white">
          Planes y precios
        </h1>
        <p className="mt-4 text-[16px] text-[#5a6480] max-w-xl mx-auto">
          Empezá gratis y crecé cuando lo necesites. Sin contratos, sin letra chica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-7 flex flex-col gap-6 ${plan.highlight ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-white/[0.07] bg-white/[0.02]'}`}
          >
            {plan.highlight && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white">Más popular</span>
              </div>
            )}
            <div>
              <h2 className="text-[16px] font-bold text-white">{plan.name}</h2>
              <p className="text-[13px] text-[#5a6480] mt-1">{plan.desc}</p>
              <div className="flex items-baseline gap-1.5 mt-4">
                <span className="text-[40px] font-extrabold tracking-tight text-white">{fmt(plan.price)}</span>
                {plan.price > 0 && <span className="text-[14px] text-[#5a6480]">{plan.period}</span>}
              </div>
              {plan.price === 0 && <p className="text-[12px] text-[#5a6480] mt-1">{plan.period}</p>}
            </div>

            <ul className="space-y-2.5 flex-1">
              {plan.features.map(feat => (
                <li key={feat} className="flex items-start gap-2.5 text-[13px] text-[#8891a8]">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  {feat}
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`inline-flex items-center justify-center h-11 rounded-xl text-[14px] font-semibold transition-opacity hover:opacity-90 ${plan.highlight ? 'text-white' : 'border border-white/[0.12] text-white hover:bg-white/5'}`}
              style={plan.highlight ? { background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.50 0.24 145))' } : {}}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-14 rounded-xl border border-white/[0.07] bg-white/[0.02] p-6">
        <h3 className="text-[15px] font-semibold text-white mb-4">Todas las formas de pago</h3>
        <p className="text-[13px] text-[#5a6480] leading-relaxed">
          El cobro de la suscripción se procesa vía <strong className="text-white">Mercado Pago</strong>. Podés pagar con tarjeta de débito, crédito o transferencia bancaria. La suscripción se renueva automáticamente cada mes y podés cancelar en cualquier momento desde tu cuenta.
        </p>
      </div>
    </div>
  )
}
