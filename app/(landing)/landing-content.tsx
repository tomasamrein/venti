import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingCart, BarChart3, Wifi, Receipt, Users, Package,
  ChevronRight, Check, TrendingDown, AlertTriangle, Clock,
  CreditCard, Smartphone, Zap, ShieldCheck, HeadphonesIcon,
  Rocket, FileText, FileSpreadsheet, Bot, Tag, ArrowRight,
  MessageCircle, Mail,
} from 'lucide-react'
import type { Metadata } from 'next'
import { AnimateIn } from '@/components/landing/animate-in'
import { FaqItem } from '@/components/landing/faq-item'
import { LandingPricing } from '@/components/landing/landing-pricing'

export const metadata: Metadata = {
  title: 'Ventix — Sistema POS para Kioscos y Comercios Argentinos',
  description: 'Software de gestión para kioscos, almacenes, drugstores y comercios minoristas de Argentina. Facturación AFIP/ARCA, control de stock, cuentas corrientes y POS. Probá 14 días gratis.',
  keywords: [
    'sistema para kiosco argentina',
    'software kiosco argentino',
    'sistema punto de venta argentina',
    'POS argentina',
    'programa para almacen argentina',
    'software para comercio argentino',
    'sistema facturación AFIP',
    'facturación ARCA',
    'control de stock kiosco',
    'gestión comercio minorista argentina',
    'programa para drugstore',
    'sistema de gestión para negocio',
    'software caja registradora argentina',
    'programa facturación electronica argentina',
    'cuentas corrientes clientes',
  ],
  alternates: {
    canonical: 'https://ventix.com.ar',
  },
  openGraph: {
    type: 'website',
    url: 'https://ventix.com.ar',
    title: 'Ventix — Sistema POS para Kioscos y Comercios Argentinos',
    description: 'Facturación AFIP/ARCA, stock automático, cuentas corrientes y cobros en segundos. Hecho para el comercio argentino.',
    siteName: 'Ventix',
    locale: 'es_AR',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Ventix — Sistema POS para comercios argentinos' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ventix — Sistema POS para Kioscos y Comercios Argentinos',
    description: 'Facturación AFIP/ARCA, stock automático, cuentas corrientes y cobros en segundos.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
}

const FEATURES_MAIN = [
  {
    num: '01',
    title: 'Cobrás en segundos, sin errores',
    desc: 'Buscás el producto por nombre o lo escaneás con el lector o la cámara del celular. El vuelto sale solo. Nada más — sin pantallas complicadas, sin perder tiempo.',
    badge: null,
    icon: ShoppingCart,
    highlights: ['Lector de código de barras USB o cámara', 'Vuelto calculado automáticamente', 'Ticket por WhatsApp o impresora'],
  },
  {
    num: '02',
    title: 'Factura A, B o C en 10 segundos',
    desc: 'Conectás tu CUIT y tu certificado una sola vez. Desde ahí, cada factura sale con número CAE al instante, sin abrir AFIP, sin buscar claves, sin demoras.',
    badge: 'Desde plan Avanzado',
    icon: Receipt,
    highlights: ['Factura A, B y C con CAE automático', 'PDF descargable con un clic', 'Enviás la factura por WhatsApp'],
  },
  {
    num: '03',
    title: 'Siempre sabés lo que tenés',
    desc: 'Con cada venta, el stock se descuenta solo. Te avisamos cuando un producto está por agotarse, antes de que te quedes sin nada. Actualizás todos los precios de un solo golpe.',
    badge: null,
    icon: Package,
    highlights: ['Alertas antes de quedarte sin stock', 'Suba de precios masiva en segundos', 'Importás desde tu planilla de Excel'],
  },
  {
    num: '04',
    title: 'El fiado, organizado de una vez',
    desc: 'Cada cliente tiene su cuenta. Ves cuánto te deben, registrás los pagos y mandás el detalle por WhatsApp. Sin cuadernos, sin confusiones, sin perder plata.',
    badge: null,
    icon: Users,
    highlights: ['Cuenta corriente por cliente', 'Registro de pagos parciales', 'Estado de cuenta por WhatsApp'],
  },
]

const WHY = [
  { icon: Rocket,          title: 'Listo en minutos',         desc: 'Creás la cuenta, cargás tus productos y ya estás vendiendo. Sin técnicos, sin instalaciones.' },
  { icon: ShieldCheck,     title: 'Hecho para Argentina',      desc: 'AFIP, Mercado Pago y precios en pesos. No es un sistema genérico traducido — es local.' },
  { icon: Wifi,            title: 'Sin internet no parás',     desc: 'El sistema sigue funcionando si se corta la conexión. Las ventas se sincronizan solas cuando vuelve.' },
  { icon: Smartphone,      title: 'Desde cualquier pantalla',  desc: 'PC, tablet o celular. El mismo sistema, los mismos datos, en tiempo real en todos tus dispositivos.' },
  { icon: HeadphonesIcon,  title: 'Soporte cuando lo necesitás', desc: 'Chatbot con IA disponible las 24 horas. Soporte humano por WhatsApp en horario comercial.' },
  { icon: CreditCard,      title: 'Sin permanencia',           desc: '14 días de prueba gratis. Después elegís el plan. Cancelás cuando querés, al instante, sin penalidades.' },
]

const PAINS = [
  { icon: TrendingDown,   tag: 'Ventas a ciegas',    text: 'No sabés cuánto vendiste hasta contar la caja a fin del día. Si hubo error, ya es tarde.' },
  { icon: AlertTriangle,  tag: 'Stock roto',          text: 'Te quedás sin el producto que más sale y lo descubrís cuando el cliente ya se fue.' },
  { icon: Receipt,        tag: 'Facturación manual',  text: 'Cada factura AFIP son minutos perdidos buscando el portal, las claves y cargando todo a mano.' },
  { icon: Clock,          tag: 'Fiados sin control',  text: 'Fiás sin registro claro y al final del mes no sabés quién te debe ni cuánto.' },
]


const FAQS = [
  { q: '¿Necesito instalar algo?', a: 'No. Ventix funciona en el navegador de tu PC, tablet o celular. No instalás nada. Si querés, lo agregás a la pantalla de inicio como una app.' },
  { q: '¿Sirve con mi lector de código de barras?', a: 'Sí. Funciona con cualquier lector USB estándar que ya tengas. También podés usar la cámara del celular para escanear.' },
  { q: '¿Cómo funciona la facturación AFIP?', a: 'Cargás tu CUIT y tu certificado fiscal una sola vez en Configuración. A partir de ahí, emitís facturas A, B o C directamente desde el sistema, con CAE al instante. Sin abrir AFIP.' },
  { q: '¿Qué pasa si se corta el internet?', a: 'El sistema sigue funcionando. Las ventas se guardan en tu dispositivo y se sincronizan solas cuando vuelve la conexión. No perdés nada.' },
  { q: '¿Cómo se cobra la suscripción?', a: 'Vía Mercado Pago. Podés pagar con tarjeta de débito, crédito o transferencia bancaria. Se renueva automáticamente cada mes. Cancelás cuando querés.' },
  { q: '¿El período de prueba es realmente gratis?', a: 'Sí. 14 días con acceso completo, sin poner ningún dato de tarjeta. Al terminar te avisamos y elegís si seguís o no.' },
  { q: '¿Puedo cargar mis productos desde Excel?', a: 'Sí. Desde Productos podés importar un archivo CSV o Excel con todo tu catálogo de una vez. Hay una plantilla para bajarte y completar.' },
]

const INTEGRATIONS = [
  { name: 'Mercado Pago',  icon: CreditCard,     color: '#009ee3' },
  { name: 'AFIP / ARCA',   icon: ShieldCheck,    color: '#1a56a4' },
  { name: 'Chatbot con IA', icon: Bot,            color: '#8b5cf6' },
  { name: 'Facturas PDF',  icon: FileText,        color: '#ef4444' },
  { name: 'Excel y CSV',   icon: FileSpreadsheet, color: '#16a34a' },
  { name: 'WhatsApp',      icon: Smartphone,      color: '#25D366' },
]

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

function PosMockup() {
  const products = [
    { name: 'Coca Cola', price: '1.250', emoji: '🥤' },
    { name: 'Café',      price: '900',   emoji: '☕' },
    { name: 'Galletitas',price: '650',   emoji: '🍪' },
    { name: 'Agua 500ml',price: '500',   emoji: '💧' },
    { name: 'Pan Lactal', price: '1.800',emoji: '🍞' },
    { name: 'Alfajor',   price: '800',   emoji: '🍫' },
  ]
  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-200 bg-white">
      <div className="bg-slate-800 px-3 py-2 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-2 bg-slate-700 rounded h-4 flex items-center px-2">
          <span className="text-[8px] text-slate-400 truncate">app.ventix.ar/kiosco-pepe/caja</span>
        </div>
      </div>
      <div className="border-b border-slate-100 px-3 py-2 flex items-center justify-between bg-white">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-[8px] font-black">V</span>
          </div>
          <span className="text-[11px] font-bold text-slate-800">Kiosco Pepe</span>
        </div>
        <div className="flex items-center gap-1 h-5 px-2 rounded-full bg-emerald-50 border border-emerald-200">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[8px] text-emerald-700 font-semibold">Caja abierta</span>
        </div>
      </div>
      <div className="flex" style={{ height: 220 }}>
        <div className="flex-1 p-2 bg-slate-50 overflow-hidden">
          <div className="grid grid-cols-3 gap-1">
            {products.map(p => (
              <div key={p.name} className="rounded-xl bg-white border border-slate-200 p-1.5 flex flex-col items-center gap-0.5 hover:border-emerald-300 cursor-pointer transition-colors">
                <span className="text-sm">{p.emoji}</span>
                <span className="text-[7px] font-semibold text-slate-700 text-center leading-tight">{p.name}</span>
                <span className="text-[8px] font-bold text-emerald-600">${p.price}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-28 border-l border-slate-100 bg-white flex flex-col p-2">
          <p className="text-[9px] font-bold text-slate-600 mb-1.5">🛒 Carrito</p>
          <div className="space-y-1 flex-1">
            {[
              { name: 'Coca Cola', qty: 2, sub: '2.500' },
              { name: 'Café',      qty: 1, sub: '900'   },
              { name: 'Alfajor',   qty: 3, sub: '2.400' },
            ].map(item => (
              <div key={item.name} className="flex justify-between items-center">
                <span className="text-[7px] text-slate-600 truncate">{item.name} ×{item.qty}</span>
                <span className="text-[7px] font-semibold text-slate-800">${item.sub}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 pt-1.5 mt-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[8px] text-slate-500">Total</span>
              <span className="text-[10px] font-black text-slate-900">$5.800</span>
            </div>
            <div className="w-full h-6 rounded-lg bg-emerald-600 flex items-center justify-center cursor-pointer hover:bg-emerald-700 transition-colors">
              <span className="text-[8px] font-bold text-white">💳 Cobrar</span>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-slate-50 border-t border-slate-100 px-3 py-1.5 flex items-center justify-between">
        <span className="text-[7px] text-slate-400">6 productos</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[7px] text-slate-400">En línea</span>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <>
      {/* ─── URGENCY STRIP ─── */}
      <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 text-amber-950">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-center gap-2 text-[12px] md:text-[13px] font-bold tracking-tight">
          <Zap className="h-3.5 w-3.5 fill-amber-950" />
          <span className="hidden sm:inline">PRECIO DE LANZAMIENTO ·</span>
          <span>50% OFF por tiempo limitado</span>
          <span className="hidden md:inline">· Solo para los primeros 30 clientes</span>
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-emerald-50/80 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-16 md:pt-20 md:pb-20">
          {/* Badge — sin opacity inline, usa fill-mode: both del CSS */}
          <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-200 bg-red-50 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span className="text-xs font-bold text-red-700 tracking-tight">
                Oferta por tiempo limitado · Sin tarjeta de crédito
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <h1
                className="text-5xl md:text-6xl xl:text-7xl font-black tracking-tight text-slate-900 leading-[1.05] animate-fade-up"
                style={{ animationDelay: '80ms' }}
              >
                Tu negocio,{' '}
                <span className="text-emerald-600 relative">
                  bajo control
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                    <path d="M2 6C60 2 180 2 298 6" stroke="#34d399" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>

              <p
                className="mt-7 text-lg md:text-xl text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed animate-fade-up"
                style={{ animationDelay: '180ms' }}
              >
                Cobrás más rápido, controlás el stock y facturás por AFIP sin complicaciones.
                Diseñado para kioscos, almacenes y drugstores argentinos.
              </p>

              <div
                className="mt-10 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 animate-fade-up"
                style={{ animationDelay: '260ms' }}
              >
                <Link
                  href="/registro"
                  className="group relative inline-flex items-center gap-2 h-12 px-8 rounded-xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black tracking-wider shadow-md">GRATIS</span>
                  Empezar prueba de 14 días <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#precios"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-base font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  Ver planes
                </Link>
              </div>

              <div
                className="mt-6 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-slate-500 animate-fade-in"
                style={{ animationDelay: '360ms' }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />Sin tarjeta de crédito
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />Cancelás cuando querés
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />Hecho en Argentina 🇦🇷
                </span>
              </div>
            </div>

            {/* Mockup — float en hijo para no conflictar con fade-up */}
            <div
              className="flex-1 w-full max-w-sm mx-auto lg:mx-0 animate-fade-up"
              style={{ animationDelay: '200ms' }}
            >
              <div className="animate-float">
                <PosMockup />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTEGRATIONS (marquee seamless) ─── */}
      <div className="relative overflow-hidden border-y border-slate-100 bg-slate-50 py-5">
        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-slate-50 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10" />

        <div className="flex animate-marquee" style={{ width: 'max-content' }}>
          {[...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS].map((item, i) => {
            const Icon = item.icon
            return (
              <div
                key={i}
                className="mx-2.5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white shadow-sm shrink-0"
                aria-hidden={i >= INTEGRATIONS.length}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{item.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── PAIN POINTS ─── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <AnimateIn className="text-center mb-12">
          <p className="inline-flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-widest mb-4">
            <span className="w-8 h-px bg-red-300" />¿Te suena familiar?<span className="w-8 h-px bg-red-300" />
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            Cada día <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-lg">perdés plata</span> sin saberlo
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-lg mx-auto">
            Sin un sistema, los pequeños descuidos se acumulan. Mirá lo que te cuesta hoy:
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAINS.map((p, i) => {
            const Icon = p.icon
            return (
              <AnimateIn key={p.text} delay={i * 80}>
                <div className="relative flex items-start gap-4 p-5 rounded-2xl bg-red-50 border border-red-100 hover:border-red-200 hover:bg-red-50/80 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <span className="inline-block mb-1.5 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black tracking-wider uppercase">
                      {p.tag}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed">{p.text}</p>
                  </div>
                </div>
              </AnimateIn>
            )
          })}
        </div>

        <AnimateIn delay={320} className="text-center mt-10">
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all hover:-translate-y-0.5"
          >
            Dejar de perder plata — Probar gratis <ArrowRight className="h-4 w-4" />
          </Link>
        </AnimateIn>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="max-w-5xl mx-auto px-4 py-8 space-y-24" id="funcionalidades">
        <AnimateIn className="text-center">
          <p className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">
            <span className="w-8 h-px bg-emerald-300" />Funcionalidades<span className="w-8 h-px bg-emerald-300" />
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            Construido para el comercio argentino
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
            Estudiamos kioscos, almacenes y drugstores para entender exactamente dónde se pierde plata y tiempo.
            Cada función de Ventix resuelve uno de esos problemas.
          </p>
        </AnimateIn>

        {FEATURES_MAIN.map((feat, i) => {
          const Icon = feat.icon
          const isEven = i % 2 === 0
          return (
            <div key={feat.num} className={`flex flex-col gap-10 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center`}>
              <AnimateIn from={isEven ? 'left' : 'right'} className="flex-1 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black text-slate-700 dark:text-slate-200 leading-none select-none">{feat.num}</span>
                  {feat.badge && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      {feat.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{feat.title}</h3>
                <p className="text-base text-slate-600 leading-relaxed max-w-md">{feat.desc}</p>
                <ul className="space-y-2.5">
                  {feat.highlights.map(h => (
                    <li key={h} className="flex items-center gap-3 text-sm text-slate-800 font-medium">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </div>
                      {h}
                    </li>
                  ))}
                </ul>
              </AnimateIn>

              <AnimateIn from={isEven ? 'right' : 'left'} className="flex-1 w-full max-w-sm mx-auto lg:mx-0">
                <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-slate-200 p-8 flex flex-col items-center justify-center min-h-52 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center mb-4">
                    <Icon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 text-center">{feat.title}</p>
                  <p className="text-xs text-slate-400 text-center mt-1">
                    {feat.badge ?? 'Incluido en todos los planes'}
                  </p>
                </div>
              </AnimateIn>
            </div>
          )
        })}
      </section>

      {/* ─── WHY US ─── */}
      <section className="bg-slate-50 py-20 mt-10">
        <div className="max-w-5xl mx-auto px-4">
          <AnimateIn className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">¿Por qué Ventix?</h2>
            <p className="mt-3 text-base text-slate-600 max-w-lg mx-auto">
              No somos un sistema genérico traducido al español. Es argentino, de punta a punta.
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY.map((w, i) => {
              const Icon = w.icon
              return (
                <AnimateIn key={w.title} delay={i * 60}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3 hover:border-emerald-200 hover:shadow-sm transition-all h-full">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{w.title}</p>
                    <p className="text-sm text-slate-600 leading-relaxed">{w.desc}</p>
                  </div>
                </AnimateIn>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <AnimateIn>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-600 to-emerald-700 px-8 py-12">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-400/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { n: '< 3s',   label: 'para completar una venta' },
                { n: '14 días', label: 'de prueba gratuita'       },
                { n: '100%',   label: 'hecho para Argentina'      },
                { n: '0',      label: 'instalaciones requeridas'  },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl md:text-5xl font-black text-white tracking-tight">{s.n}</p>
                  <p className="text-xs text-emerald-100 mt-2 leading-tight font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ─── GUARANTEE / TRUST ─── */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <AnimateIn>
          <div className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0 w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center shadow-md shadow-amber-300/50">
              <ShieldCheck className="h-8 w-8 text-amber-950" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="inline-block px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-black tracking-wider uppercase mb-2">
                Garantía total
              </p>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Si en 14 días no te convence, no pagás nada
              </h3>
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                No te pedimos tarjeta para arrancar. Probás todas las funciones por 14 días.
                Si no te sirve, simplemente no seguís. <span className="font-bold text-slate-900">Sin letra chica, sin permanencia.</span>
              </p>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <AnimateIn className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Empezás en 10 minutos</h2>
        </AnimateIn>
        <div>
          {[
            { n: '1', title: 'Creás tu cuenta', desc: 'Registrás el negocio y cargás tus productos. Sin técnicos, sin instalaciones, desde cualquier dispositivo.' },
            { n: '2', title: 'Abrís la caja',   desc: 'Entrás a Ventix en tu PC, tablet o celular. Conectás el lector de barras o usás la cámara. Abrís la caja y empezás.' },
            { n: '3', title: 'Vendés y controlás', desc: 'El stock se actualiza solo. Los reportes se hacen solos. Las facturas salen con un clic.' },
          ].map((s, i) => (
            <AnimateIn key={s.n} delay={i * 100} className="flex gap-5 pb-8">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-sm font-black shrink-0">
                  {s.n}
                </div>
                {i < 2 && <div className="w-px flex-1 bg-emerald-100 mt-2" />}
              </div>
              <div className="flex-1 pt-1.5 pb-4">
                <p className="text-base font-bold text-slate-900">{s.title}</p>
                <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{s.desc}</p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="max-w-5xl mx-auto px-4 py-16 space-y-10" id="precios">
        <LandingPricing />
        <AnimateIn delay={300}>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-center gap-4 max-w-2xl mx-auto">
            <Image src="/mercadopago-icon.png" alt="Mercado Pago" width={40} height={40} className="shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-800">Pagás con Mercado Pago</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Débito, crédito o transferencia. Mensual automático. Oferta por tiempo limitado para los primeros 30 clientes. Cancelás cuando querés.
              </p>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-2xl mx-auto px-4 py-16" id="faq">
        <AnimateIn className="text-center mb-10">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Preguntas frecuentes</h2>
        </AnimateIn>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <AnimateIn key={faq.q} delay={i * 50}>
              <FaqItem q={faq.q} a={faq.a} />
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="max-w-5xl mx-auto px-4 py-12" id="contacto">
        <AnimateIn>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-2">¿Tenés dudas antes de empezar?</h2>
            <p className="text-slate-500 text-sm mb-8 max-w-sm mx-auto">
              Escribinos y te respondemos en el día.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://wa.me/543437479134?text=Hola!%20Quiero%20saber%20m%C3%A1s%20sobre%20Ventix"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-xl bg-[#25D366] hover:bg-[#20b558] text-white text-sm font-bold transition-all hover:shadow-md"
              >
                <MessageCircle className="h-4 w-4" />
                Escribirnos por WhatsApp
              </a>
              <a
                href="mailto:contacto@ventix.com.ar"
                className="inline-flex items-center justify-center gap-2.5 h-12 px-7 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-bold hover:bg-slate-50 transition-all"
              >
                <Mail className="h-4 w-4" />
                contacto@ventix.com.ar
              </a>
            </div>
          </div>
        </AnimateIn>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="max-w-5xl mx-auto px-4 py-8 pb-20">
        <AnimateIn>
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-10 py-16 text-center">
            <div className="pointer-events-none absolute -top-10 -right-10 w-64 h-64 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400 text-amber-950 text-[11px] font-black uppercase tracking-widest mb-6 shadow-lg shadow-amber-500/30">
                <Zap className="h-3 w-3 fill-amber-950" />
                50% off por tiempo limitado · solo 30 lugares
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                14 días gratis.<br />
                <span className="text-emerald-400">Sin tarjeta. Sin riesgo.</span>
              </h2>
              <p className="mt-4 text-slate-300 text-base max-w-md mx-auto">
                Más de 100 negocios ya están probando Ventix. Sumate hoy y arrancás en 10 minutos.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 mt-8 h-13 px-10 py-3.5 rounded-xl text-base font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all hover:shadow-xl hover:shadow-emerald-900/30 hover:-translate-y-0.5"
              >
                Crear mi cuenta gratis <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-[12px] text-slate-400">
                ⚡ Listo en 10 minutos · Sin instalaciones · Soporte por WhatsApp
              </p>
            </div>
          </div>
        </AnimateIn>
      </section>
    </>
  )
}
