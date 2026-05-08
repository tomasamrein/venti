import Link from 'next/link'
import {
  ShoppingCart, BarChart3, Wifi, Receipt, Users, Package,
  ChevronRight, ChevronDown, Check, TrendingDown, AlertTriangle,
  Clock, CreditCard, Smartphone, Zap, Star,
  ShieldCheck, HeadphonesIcon, Rocket, Globe,
  FileText, FileSpreadsheet, Bot,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ventix - El sistema #1 para comercios',
  description: 'El sistema de punto de venta para kioscos, almacenes y drugstores argentinos. Facturación ARCA, stock, cuentas corrientes y reportes. 14 días gratis.',
  openGraph: {
    title: 'Ventix — Sistema POS para negocios argentinos',
    description: 'Dejá de perder plata por no controlar el stock.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

const INTEGRATIONS = [
  { name: 'Mercado Pago', icon: CreditCard, color: '#009ee3' },
  { name: 'Chatbot IA', icon: Bot, color: '#8b5cf6' },
  { name: 'ARCA / AFIP', icon: ShieldCheck, color: '#1a56a4' },
  { name: 'Excel & CSV', icon: FileSpreadsheet, color: '#16a34a' },
  { name: 'Facturas PDF', icon: FileText, color: '#ef4444' },
]

const WHY = [
  {
    icon: Rocket,
    title: 'Listo en minutos',
    desc: 'Creás la cuenta, cargás tus productos y ya estás vendiendo. Sin técnicos, sin instalaciones, sin días perdidos.',
  },
  {
    icon: ShieldCheck,
    title: 'Hecho para Argentina',
    desc: 'Facturación ARCA, cobros con Mercado Pago y precios en pesos. No es un sistema genérico traducido — es local.',
  },
  {
    icon: Globe,
    title: 'Funciona en cualquier dispositivo',
    desc: 'Podes utilizarlo desde la PC y desde tu celular, o tablet.',
  },
  {
    icon: Wifi,
    title: 'Sin internet no parás',
    desc: 'El POS sigue funcionando offline. Las ventas se sincronizan solas cuando vuelve la conexión.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Soporte 24/7',
    desc: 'Cualquier duda que tengas podrás resolverla con nuestro chatbot IA. Además cuentas con soporte por WhatsApp en horario comercial.',
  },
  {
    icon: CreditCard,
    title: 'Sin permanencia',
    desc: '14 días gratis para probar todo. Después elegís el plan que necesitás. Cancelás cuando querés, al instante.',
  },
]

const PAINS = [
  { icon: TrendingDown, text: 'No sabés cuánto vendiste realmente hasta que contás la caja a fin del día' },
  { icon: AlertTriangle, text: 'Te quedás sin stock de lo que más vendés y no te enterás a tiempo' },
  { icon: CreditCard, text: 'Emitir una factura te lleva 5 minutos buscando el portal de AFIP' },
  { icon: Clock, text: 'No tenés registro de las deudas de tus clientes y perdés plata por fiar sin control' },
]

const FEATURES = [
  {
    icon: ShoppingCart,
    title: 'Ventas que no te frenan',
    desc: 'Escaneás con lector USB o cámara del celular. Cobrás en segundos. El stock se descuenta solo.',
    badge: null,
  },
  {
    icon: Receipt,
    title: 'Factura A, B y C sin salir del sistema',
    desc: 'Conectás tu CUIT una sola vez y emitís facturas con CAE directamente desde la caja.',
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
    desc: 'El sistema sigue andando si se corta la conexión. Sincroniza solo cuando vuelve.',
    badge: 'Offline',
  },
]

const PLANS = [
  {
    name: 'Simple',
    icon: Zap,
    price: 30000,
    features: [
      'POS con escáner de barras',
      'Stock con alertas automáticas',
      'Clientes y cuentas corrientes',
      'Export de ventas para tu contador',
      'Funciona offline',
      'Chatbot IA + soporte WhatsApp',
    ],
    cta: 'Empezar gratis 14 días',
    href: '/registro',
    highlight: false,
    wa: false,
  },
  {
    name: 'Avanzado',
    icon: Package,
    price: 50000,
    features: [
      'Todo lo del plan Simple',
      'Facturación ARCA (A, B y C)',
      'Reportes y dashboard',
      'Gestión de proveedores',
      'Actualización masiva de precios',
      'Historial de precios',
    ],
    cta: 'Suscribirme',
    href: '/registro',
    highlight: true,
    wa: false,
  },
  {
    name: 'Profesional',
    icon: Star,
    price: 100000,
    features: [
      'Todo lo del plan Avanzado',
      'Múltiples sucursales',
      'Gestión de equipo con roles',
      'Historial de ventas por empleado',
      'Notificaciones push de stock',
      'Soporte prioritario',
    ],
    cta: 'Contactanos',
    href: '/contacto',
    highlight: false,
    wa: false,
  },
]

const FAQS = [
  {
    q: '¿Necesito instalar algo?',
    a: 'No. Ventix funciona en el navegador. Sirve en PC, tablet y celular sin instalar nada.',
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
    a: 'El sistema sigue funcionando. Las ventas se guardan localmente y se sincronizan automáticamente cuando vuelve la conexión.',
  },
  {
    q: '¿Cómo se cobra la suscripción?',
    a: 'Vía Mercado Pago. Podés pagar con tarjeta de débito, crédito o transferencia. Se renueva cada mes y podés cancelar cuando querés.',
  },
  {
    q: '¿Los 14 días de prueba son gratis de verdad?',
    a: 'Sí. Sin tarjeta de crédito. Accedés a todas las funcionalidades del plan Simple. Al terminar el trial te avisamos para que elijas si seguís o no.',
  },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-700">14 días gratis · Sin tarjeta de crédito</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 leading-tight max-w-4xl mx-auto">
          El sistema más completo y moderno para{' '}
          <span className="text-emerald-600">comercios argentinos</span>
        </h1>

        <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Ventix está diseñado para kioscos, almacenes y drugstores.
          Facturación ARCA, stock automático y caja en segundos.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-lg text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            Probarlo gratis <ChevronRight className="h-4 w-4" />
          </Link>
          <Link
            href="#precios"
            className="inline-flex items-center gap-2 h-12 px-7 rounded-lg text-base font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Ver planes
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">14 días gratis · Sin permanencia · Cancelás cuando querés</p>

      </section>

      {/* Integrations strip */}
      <div className="w-full border-y border-slate-100 bg-white py-5">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap items-center justify-center gap-3">
          {INTEGRATIONS.map(item => {
            const Icon = item.icon
            return (
              <div key={item.name} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50">
                <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                <span className="text-xs font-medium text-slate-600">{item.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Por qué elegirnos */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            ¿Por qué elegirnos?
          </h2>
          <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
            No somos otro SaaS genérico. Ventix fue construido específicamente para el comercio argentino.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {WHY.map(w => {
            const Icon = w.icon
            return (
              <div key={w.title} className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col gap-4 hover:border-emerald-200 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{w.title}</p>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{w.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Pain points */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-red-100 bg-red-50 p-8">
          <p className="text-center text-sm font-semibold text-red-600 mb-6">
            Si manejás tu negocio sin un sistema, probablemente te estés comiendo esto todos los días
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PAINS.map(p => {
              const Icon = p.icon
              return (
                <div key={p.text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{p.text}</p>
                </div>
              )
            })}
          </div>
          <p className="text-center mt-6 text-sm text-slate-500">
            Con Ventix, todo eso desaparece.{' '}
            <Link href="/registro" className="text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2">
              Probalo gratis 14 días →
            </Link>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Todo lo que necesitás, sin lo que no
          </h2>
          <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
            Diseñado para el ritmo real de un comercio argentino. Rápido, simple y sin curva de aprendizaje.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(f => {
            const Icon = f.icon
            return (
              <div key={f.title}
                className="rounded-xl border border-slate-200 bg-white p-6 space-y-3 hover:border-slate-300 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  {f.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {f.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { n: '< 3s', label: 'para completar una venta' },
              { n: '14 días', label: 'de prueba gratuita' },
              { n: '100%', label: 'hecho para Argentina' },
              { n: '0', label: 'instalaciones requeridas' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-emerald-600">{s.n}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Empezás en minutos
          </h2>
        </div>
        <div className="space-y-4">
          {[
            { step: '1', title: 'Creás tu cuenta', desc: 'Registrás el negocio, cargás los productos y listo. Sin instalar nada.' },
            { step: '2', title: 'Conectás tu caja', desc: 'Abrís Ventix en cualquier dispositivo. PC, tablet o celular. Escaneás o buscás productos.' },
            { step: '3', title: 'Vendés y controlás', desc: 'El stock se actualiza solo. Los reportes se generan solos. Las facturas salen solas.' },
          ].map(s => (
            <div key={s.step} className="flex gap-4 items-start">
              <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center text-sm font-bold text-emerald-600 border border-emerald-200 bg-emerald-50">
                {s.step}
              </div>
              <div className="flex-1 pb-4 border-b border-slate-100 last:border-0">
                <p className="text-sm font-semibold text-slate-900">{s.title}</p>
                <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-16 bg-slate-50 rounded-2xl" id="precios">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Planes simples, sin sorpresas
          </h2>
          <p className="mt-3 text-base text-slate-500">Probá el plan Simple gratis 14 días. Sin tarjeta de crédito.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-6 flex flex-col gap-5 bg-white ${plan.highlight ? 'border-emerald-400 shadow-md shadow-emerald-100' : 'border-slate-200'
                  }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white whitespace-nowrap">
                      + completo
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-slate-600" />
                  </div>
                </div>
                <div>
                  <p className="text-base font-bold text-slate-900">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mt-3">
                    {plan.price !== null ? (
                      <>
                        <span className="text-3xl font-bold tracking-tight text-slate-900">{fmt(plan.price)}</span>
                        <span className="text-xs text-slate-400">/mes</span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-slate-700">A consultar</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`inline-flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm font-semibold transition-colors ${plan.highlight
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {plan.cta} <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            )
          })}
        </div>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 max-w-3xl mx-auto flex items-center gap-4">
          <Smartphone className="h-8 w-8 text-slate-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Pagás con Mercado Pago</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Débito, crédito o transferencia. Se cobra mensual automáticamente. Cancelás desde tu cuenta en cualquier momento.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-center mb-10">
          Preguntas frecuentes
        </h2>
        <div className="space-y-3">
          {FAQS.map(faq => (
            <details key={faq.q} className="group rounded-xl border border-slate-200 bg-white">
              <summary className="flex items-center justify-between p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-semibold text-slate-900 pr-4">{faq.q}</span>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 text-sm text-slate-500 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Empezá hoy, gratis
          </h2>
          <p className="mt-3 text-base text-slate-500 max-w-md mx-auto">
            14 días con todas las funcionalidades. Sin tarjeta. Sin compromiso.
          </p>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 mt-8 h-12 px-8 rounded-lg text-base font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            Crear cuenta gratis <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
