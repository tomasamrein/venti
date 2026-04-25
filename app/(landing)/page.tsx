import Link from 'next/link'
import {
  ShoppingCart, BarChart3, Wifi, Receipt, Users, Package,
  ChevronRight, Check, Zap, TrendingDown, AlertTriangle,
  Clock, CreditCard, Smartphone, ArrowRight,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Venti — POS y CRM para negocios argentinos',
  description: 'Dejá de perder plata por no controlar el stock. POS con facturación ARCA, gestión de clientes y reportes para kioscos, almacenes y comercios de Argentina.',
  openGraph: {
    title: 'Venti — POS y CRM para negocios argentinos',
    description: 'Dejá de perder plata por no controlar el stock.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

const PAINS = [
  { icon: TrendingDown, text: 'No sabés cuánto vendiste realmente hasta que contás la caja a fin del día' },
  { icon: AlertTriangle, text: 'Te quedás sin stock de lo que más vendés y no te enterás a tiempo' },
  { icon: CreditCard, text: 'Emitir una factura te lleva 5 minutos buscando el portal de AFIP' },
  { icon: Clock, text: 'No tenés registro de las deudas de tus clientes y perdés plata por fiar sin control' },
]

const FEATURES = [
  {
    icon: ShoppingCart,
    title: 'POS que no te frena',
    desc: 'Escaneás con lector USB o cámara del celular. Cobrás en segundos. El stock se descuenta solo.',
    badge: null,
  },
  {
    icon: Receipt,
    title: 'Factura A, B y C sin salir de la caja',
    desc: 'Conectás tu CUIT una sola vez y emitís facturas con CAE directamente desde el POS.',
    badge: 'ARCA',
  },
  {
    icon: Package,
    title: 'Stock bajo control',
    desc: 'Alertas automáticas cuando un producto está por agotarse. Actualizás precios de todo el catálogo en un clic.',
    badge: null,
  },
  {
    icon: Users,
    title: 'Clientes y cuentas corrientes',
    desc: 'Registrá fiados, cobrá deudas y enviá el estado de cuenta por WhatsApp.',
    badge: null,
  },
  {
    icon: BarChart3,
    title: 'Reportes que te dicen algo',
    desc: 'Ventas del día, semana y mes. Qué productos te dejan más plata. Cómo cerró cada cajero.',
    badge: null,
  },
  {
    icon: Wifi,
    title: 'Funciona sin internet',
    desc: 'El POS sigue andando si se corta la conexión. Sincroniza solo cuando vuelve.',
    badge: 'Offline',
  },
]

const PLANS = [
  {
    name: 'Basic',
    price: 49999,
    period: '/mes',
    desc: 'Para negocios con una sola sucursal.',
    features: [
      '1 sucursal',
      'Usuarios ilimitados',
      'POS con escáner de barras',
      'Facturación ARCA (A, B, C)',
      'Stock con alertas automáticas',
      'Clientes y cuentas corrientes',
      'Proveedores',
      'Reportes y dashboard',
      'Export CSV y Excel',
      'Funciona offline',
      'Soporte por WhatsApp',
    ],
    cta: 'Empezar gratis 14 días',
    href: '/registro?plan=basic',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 49999,
    priceNote: 'por sucursal / mes',
    period: '/sucursal/mes',
    desc: 'Para cadenas y negocios con múltiples puntos de venta.',
    features: [
      'Todo lo de Basic',
      'Sucursales ilimitadas',
      'Dashboard consolidado multi-sucursal',
      'Reportes comparativos por sucursal',
      'Notificaciones push',
      'Soporte prioritario',
    ],
    cta: 'Empezar gratis 14 días',
    href: '/registro?plan=pro',
    highlight: true,
  },
]

const FAQS = [
  {
    q: '¿Necesito instalar algo?',
    a: 'No. Venti funciona en el navegador. Sirve en PC, tablet y celular sin instalar nada.',
  },
  {
    q: '¿Funciona con mi lector de código de barras USB?',
    a: 'Sí. Detecta automáticamente lectores USB y también permite escanear con la cámara del celular.',
  },
  {
    q: '¿Cómo funciona la facturación ARCA?',
    a: 'Conectás tu CUIT y certificado fiscal una sola vez en configuración. Desde ahí emitís facturas A, B o C directamente desde la caja, con CAE al instante.',
  },
  {
    q: '¿Qué pasa si se corta el internet?',
    a: 'El POS sigue funcionando. Las ventas se guardan localmente y se sincronizan automáticamente cuando vuelve la conexión.',
  },
  {
    q: '¿Cómo se cobra la suscripción?',
    a: 'Vía Mercado Pago. Podés pagar con tarjeta de débito, crédito o transferencia. Se renueva cada mes y podés cancelar cuando quieras.',
  },
  {
    q: '¿Los 14 días de prueba son gratis de verdad?',
    a: 'Sí. Sin tarjeta de crédito. Accedés a todas las funcionalidades del plan que elegiste. Al terminar el trial, elegís si seguís o no.',
  },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_-10%,oklch(0.40_0.18_160_/_0.20),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_20%,oklch(0.45_0.22_278_/_0.10),transparent)]" />
        <div className="max-w-6xl mx-auto px-4 pt-28 pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[12px] font-medium text-emerald-300">14 días gratis · Sin tarjeta de crédito</span>
          </div>

          <h1 className="text-[46px] md:text-[68px] font-extrabold tracking-[-0.04em] text-white leading-[1.02] max-w-4xl mx-auto">
            ¿Cuánto perdés por no{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                controlar tu negocio?
              </span>
            </span>
          </h1>

          <p className="mt-6 text-[17px] md:text-[19px] text-[#8891a8] max-w-2xl mx-auto leading-relaxed">
            Venti es el POS para kioscos, almacenes y comercios argentinos que cierra la caja sola,
            factura con ARCA y te avisa cuando te quedás sin stock.
          </p>

          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 h-13 px-7 rounded-xl text-[15px] font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.48 0.25 145))', boxShadow: '0 0 32px oklch(0.55 0.22 160 / 0.35)' }}
            >
              Probarlo gratis <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="#precios"
              className="inline-flex items-center gap-2 h-13 px-7 rounded-xl text-[15px] font-medium text-[#8891a8] border border-white/[0.10] hover:text-white hover:border-white/20 transition-colors"
            >
              Ver planes
            </Link>
          </div>
          <p className="mt-4 text-[12px] text-[#3d4560]">Sin permanencia · Cancelás cuando querés</p>
        </div>
      </section>

      {/* Pain points */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-red-500/10 bg-red-500/[0.03] p-8">
          <p className="text-center text-[13px] font-semibold text-red-400 uppercase tracking-wider mb-6">
            Si manejás tu negocio sin un sistema, probablemente te estés comiendo esto todos los días
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAINS.map(p => {
              const Icon = p.icon
              return (
                <div key={p.text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-red-400" />
                  </div>
                  <p className="text-[14px] text-[#8891a8] leading-relaxed">{p.text}</p>
                </div>
              )
            })}
          </div>
          <p className="text-center mt-6 text-[14px] text-[#5a6480]">
            Con Venti, todo eso desaparece.{' '}
            <Link href="/registro" className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2">
              Probalo gratis 14 días →
            </Link>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <h2 className="text-[34px] md:text-[44px] font-extrabold tracking-[-0.03em] text-white">
            Todo lo que necesitás, sin lo que no
          </h2>
          <p className="mt-3 text-[15px] text-[#5a6480] max-w-xl mx-auto">
            Diseñado para el ritmo real de un comercio argentino. Rápido, simple y sin curva de aprendizaje.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title}
                className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-6 space-y-3 hover:bg-white/[0.04] hover:border-white/[0.10] transition-all group">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                    <Icon className="h-5 w-5 text-emerald-400" />
                  </div>
                  {f.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-[15px] font-semibold text-white">{f.title}</h3>
                <p className="text-[13px] text-[#5a6480] leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Social proof / numbers */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { n: '< 3s', label: 'para completar una venta' },
              { n: '14 días', label: 'de prueba gratuita' },
              { n: '100%', label: 'hecho para Argentina' },
              { n: '0', label: 'instalaciones requeridas' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-[32px] font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                  {s.n}
                </p>
                <p className="text-[12px] text-[#5a6480] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-[34px] md:text-[40px] font-extrabold tracking-[-0.03em] text-white">
            Empezás en minutos
          </h2>
        </div>
        <div className="space-y-4">
          {[
            { step: '01', title: 'Creás tu cuenta', desc: 'Registrás el negocio, cargás los productos y listo. Sin instalar nada.' },
            { step: '02', title: 'Conectás tu caja', desc: 'Abrís Venti en cualquier dispositivo. PC, tablet o celular. Escanear o buscar productos.' },
            { step: '03', title: 'Vendés y controlás', desc: 'El stock se actualiza solo. Los reportes se generan solos. Las facturas salen solas.' },
          ].map((s, i) => (
            <div key={s.step} className="flex gap-5 items-start">
              <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-[13px] font-black text-emerald-400 border border-emerald-500/20 bg-emerald-500/5">
                {s.step}
              </div>
              <div className="flex-1 pb-4 border-b border-white/[0.05] last:border-0">
                <p className="text-[15px] font-semibold text-white">{s.title}</p>
                <p className="text-[13px] text-[#5a6480] mt-1">{s.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:flex items-center">
                  <ArrowRight className="h-4 w-4 text-[#3d4560]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-16" id="precios">
        <div className="text-center mb-14">
          <h2 className="text-[34px] md:text-[44px] font-extrabold tracking-[-0.03em] text-white">
            Un precio claro, sin sorpresas
          </h2>
          <p className="mt-3 text-[15px] text-[#5a6480]">14 días gratis en cualquier plan. Sin tarjeta de crédito.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-7 flex flex-col gap-6 ${
                plan.highlight
                  ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.07] to-transparent'
                  : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Multi-sucursal
                  </span>
                </div>
              )}
              <div>
                <p className="text-[14px] font-bold text-white">{plan.name}</p>
                <p className="text-[13px] text-[#5a6480] mt-0.5">{plan.desc}</p>
                <div className="flex items-baseline gap-1.5 mt-4">
                  <span className="text-[42px] font-extrabold tracking-tight text-white">{fmt(plan.price)}</span>
                </div>
                <p className="text-[12px] text-[#5a6480] mt-0.5">{plan.priceNote ?? 'por mes'}</p>
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
                className={`inline-flex items-center justify-center gap-2 h-11 rounded-xl text-[14px] font-semibold transition-all hover:scale-[1.01] ${
                  plan.highlight
                    ? 'text-white'
                    : 'border border-white/[0.12] text-white hover:bg-white/5'
                }`}
                style={plan.highlight ? { background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.48 0.25 145))' } : {}}
              >
                {plan.cta} <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-white/[0.06] bg-white/[0.015] p-5 max-w-3xl mx-auto flex items-center gap-4">
          <Smartphone className="h-8 w-8 text-[#5a6480] shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-white">Pagás con Mercado Pago</p>
            <p className="text-[12px] text-[#5a6480] mt-0.5">
              Débito, crédito o transferencia. Se cobra mensual automáticamente. Cancelás desde tu cuenta en cualquier momento.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-[34px] font-extrabold tracking-[-0.03em] text-white text-center mb-10">
          Preguntas frecuentes
        </h2>
        <div className="space-y-3">
          {FAQS.map(faq => (
            <div key={faq.q} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 hover:bg-white/[0.03] transition-colors">
              <p className="text-[14px] font-semibold text-white mb-2">{faq.q}</p>
              <p className="text-[13px] text-[#5a6480] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 p-12 text-center"
          style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 50%, oklch(0.35 0.12 160 / 0.15), transparent), oklch(0.08 0.01 264 / 1)' }}>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,oklch(0.55_0.22_160_/_0.08),transparent)]" />
          <div className="relative">
            <h2 className="text-[36px] md:text-[48px] font-extrabold tracking-[-0.03em] text-white">
              Empezá hoy, gratis
            </h2>
            <p className="mt-3 text-[16px] text-[#8891a8] max-w-md mx-auto">
              14 días con todas las funcionalidades. Sin tarjeta. Sin compromiso.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 mt-8 h-13 px-8 rounded-xl text-[15px] font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.48 0.25 145))', boxShadow: '0 0 40px oklch(0.55 0.22 160 / 0.30)' }}
            >
              Crear cuenta gratis <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
