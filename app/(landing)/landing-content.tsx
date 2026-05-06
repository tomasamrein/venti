import Link from 'next/link'
import {
  ShoppingCart, BarChart3, Wifi, Receipt, Users, Package,
  ChevronRight, Check, TrendingDown, AlertTriangle,
  Clock, CreditCard, Smartphone,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ventix — Software para negocios argentinos',
  description: 'Dejá de perder plata por no controlar el stock. Software con facturación ARCA, gestión de clientes y reportes para kioscos, almacenes y comercios de Argentina.',
  openGraph: {
    title: 'Ventix — Software para negocios argentinos',
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
    name: 'Single',
    price: 49999,
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
    name: 'Multi-sucursal',
    price: null,
    desc: 'Para cadenas y negocios con múltiples puntos de venta.',
    features: [
      'Todo lo de Single',
      'Sucursales ilimitadas',
      'Dashboard consolidado',
      'Reportes comparativos por sucursal',
      'Notificaciones push',
      'Soporte prioritario + onboarding',
      'Implementación asistida',
    ],
    cta: 'Consultar precio',
    href: 'https://wa.me/5492604000000?text=Hola%2C+quiero+info+sobre+el+plan+Multi-sucursal+de+Ventix',
    highlight: true,
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
    a: 'Sí. Sin tarjeta de crédito. Accedés a todas las funcionalidades del plan Single. Al terminar el trial te avisamos para que elijas si seguís o no.',
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
          El sistema que necesita{' '}
          <span className="text-emerald-600">tu negocio</span>
        </h1>

        <p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Ventix es el software para kioscos, almacenes y comercios argentinos que cierra la caja sola,
          factura con ARCA y te avisa cuando te quedás sin stock.
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
            Un precio claro, sin sorpresas
          </h2>
          <p className="mt-3 text-base text-slate-500">14 días gratis en el plan Single. Sin tarjeta de crédito.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {PLANS.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-xl border p-7 flex flex-col gap-6 bg-white ${
                plan.highlight ? 'border-emerald-300 shadow-sm' : 'border-slate-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white">
                    Multi-sucursal
                  </span>
                </div>
              )}
              <div>
                <p className="text-base font-bold text-slate-900">{plan.name}</p>
                <p className="text-sm text-slate-500 mt-0.5">{plan.desc}</p>
                <div className="flex items-baseline gap-1.5 mt-4">
                  {plan.price !== null ? (
                    <span className="text-4xl font-bold tracking-tight text-slate-900">{fmt(plan.price)}</span>
                  ) : (
                    <span className="text-2xl font-bold text-slate-700">A consultar</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {plan.price !== null ? 'por mes' : 'precio por sucursal según escala'}
                </p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {plan.features.map(feat => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                target={plan.highlight ? '_blank' : undefined}
                rel={plan.highlight ? 'noopener noreferrer' : undefined}
                className={`inline-flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-semibold transition-colors ${
                  plan.highlight
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {plan.cta} <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          ))}
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
            <div key={faq.q} className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm font-semibold text-slate-900 mb-2">{faq.q}</p>
              <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
            </div>
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
