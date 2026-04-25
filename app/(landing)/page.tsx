import Link from 'next/link'
import { ShoppingCart, BarChart3, Wifi, Receipt, Users, Package, CreditCard, Zap, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Venti — POS y CRM para negocios argentinos',
  description: 'Sistema de punto de venta y CRM pensado para kioscos, almacenes y comercios minoristas de Argentina. Probalo gratis 14 días.',
}

const FEATURES = [
  { icon: ShoppingCart, title: 'Punto de Venta rápido', desc: 'Escáner de código de barras, búsqueda de productos y cierre de ventas en segundos.' },
  { icon: Receipt, title: 'Facturación ARCA', desc: 'Emití facturas A, B y C directamente desde la caja, con CAE al instante.' },
  { icon: BarChart3, title: 'Reportes y dashboard', desc: 'Visualizá ventas, stock y caja en tiempo real. Exportá a Excel o CSV.' },
  { icon: Package, title: 'Gestión de stock', desc: 'Alertas de stock bajo, historial de precios y actualización masiva.' },
  { icon: Users, title: 'Clientes y cuentas corrientes', desc: 'Registrá clientes, gestioná deudas y enviá comprobantes por WhatsApp.' },
  { icon: Wifi, title: 'Funciona sin internet', desc: 'El POS sigue funcionando offline y sincroniza automáticamente al volver.' },
]

const PLANS = [
  {
    name: 'Free Trial',
    price: 'Gratis',
    period: '14 días',
    features: ['1 sucursal', '2 usuarios', 'POS completo', 'Reportes básicos'],
    cta: 'Empezar gratis',
    href: '/registro',
    highlight: false,
  },
  {
    name: 'Basic',
    price: '$15.000',
    period: '/mes',
    features: ['1 sucursal', '5 usuarios', 'Todo el Free Trial', 'Facturación ARCA', 'Soporte prioritario'],
    cta: 'Elegir Basic',
    href: '/registro?plan=basic',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$35.000',
    period: '/mes',
    features: ['Sucursales ilimitadas', 'Usuarios ilimitados', 'Todo el Basic', 'Reportes avanzados', 'API access'],
    cta: 'Elegir Pro',
    href: '/registro?plan=pro',
    highlight: false,
  },
]

const FAQS = [
  { q: '¿Necesito instalar algo?', a: 'No. Venti corre en el navegador. Funciona en PC, tablet y celular sin instalación.' },
  { q: '¿Puedo usar mi lector de código de barras USB?', a: 'Sí. Venti detecta automáticamente lectores USB y también permite escanear con la cámara del celular.' },
  { q: '¿Cómo funciona la facturación ARCA?', a: 'Conectás tu CUIT y certificado fiscal una sola vez, y desde ahí emitís facturas A, B o C directamente desde la caja.' },
  { q: '¿Qué pasa si me quedo sin internet?', a: 'El POS sigue funcionando offline. Las ventas se guardan localmente y se sincronizan automáticamente al recuperar conexión.' },
  { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí. Sin permanencia. Cancelás desde tu cuenta y no se cobra más.' },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.45_0.18_160_/_0.15),transparent)]" />
        <div className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-6">
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-[12px] font-medium text-emerald-300">14 días gratis, sin tarjeta</span>
          </div>
          <h1 className="text-[48px] md:text-[64px] font-extrabold tracking-[-0.04em] text-white leading-[1.05] max-w-3xl mx-auto">
            El POS que entiende<br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">tu negocio</span>
          </h1>
          <p className="mt-6 text-[16px] md:text-[18px] text-[#8891a8] max-w-2xl mx-auto leading-relaxed">
            Sistema de punto de venta y CRM para kioscos, almacenes y comercios minoristas de Argentina.
            Con facturación ARCA, gestión de stock y modo offline.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.50 0.24 145))' }}
            >
              Empezar gratis <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/precios"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl text-[15px] font-medium text-[#8891a8] border border-white/[0.10] hover:text-white hover:border-white/20 transition-colors"
            >
              Ver precios
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-[#5a6480]">Sin tarjeta de crédito · Sin permanencia</p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] text-white">
            Todo lo que necesitás en un solo lugar
          </h2>
          <p className="mt-3 text-[15px] text-[#5a6480] max-w-xl mx-auto">
            Diseñado para el ritmo real de un comercio argentino.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-3 hover:bg-white/[0.04] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="text-[15px] font-semibold text-white">{f.title}</h3>
                <p className="text-[13px] text-[#5a6480] leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-16" id="precios">
        <div className="text-center mb-12">
          <h2 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] text-white">Planes simples</h2>
          <p className="mt-3 text-[15px] text-[#5a6480]">Sin letra chica. Sin sorpresas.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 space-y-5 flex flex-col ${plan.highlight ? 'border-emerald-500/40 bg-emerald-500/[0.06]' : 'border-white/[0.07] bg-white/[0.02]'}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-white">Más popular</span>
                </div>
              )}
              <div>
                <p className="text-[13px] font-medium text-[#8891a8]">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[36px] font-extrabold tracking-tight text-white">{plan.price}</span>
                  <span className="text-[14px] text-[#5a6480]">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-center gap-2 text-[13px] text-[#8891a8]">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={`inline-flex items-center justify-center h-10 rounded-xl text-[14px] font-semibold transition-opacity hover:opacity-90 ${plan.highlight ? 'text-white' : 'border border-white/[0.12] text-white hover:bg-white/5'}`}
                style={plan.highlight ? { background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.50 0.24 145))' } : {}}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-[32px] font-extrabold tracking-[-0.03em] text-white text-center mb-10">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {FAQS.map(faq => (
            <div key={faq.q} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[14px] font-semibold text-white mb-2">{faq.q}</p>
              <p className="text-[13px] text-[#5a6480] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-10 text-center">
          <h2 className="text-[32px] md:text-[40px] font-extrabold tracking-[-0.03em] text-white">
            Empezá hoy, gratis
          </h2>
          <p className="mt-3 text-[15px] text-[#5a6480] max-w-md mx-auto">
            14 días de prueba con todas las funcionalidades. Sin tarjeta requerida.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 mt-6 h-12 px-8 rounded-xl text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.50 0.24 145))' }}
          >
            Crear cuenta gratis <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
