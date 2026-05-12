import Link from 'next/link'
import Image from 'next/image'
import {
  ShoppingCart, BarChart3, Wifi, Receipt, Users, Package,
  ChevronRight, Check, TrendingDown, AlertTriangle, Clock,
  CreditCard, Smartphone, Zap, Star, ShieldCheck, HeadphonesIcon,
  Rocket, FileText, FileSpreadsheet, Bot, Tag, ArrowRight,
  MessageCircle, Mail,
} from 'lucide-react'
import type { Metadata } from 'next'
import { AnimateIn } from '@/components/landing/animate-in'
import { FaqItem } from '@/components/landing/faq-item'

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
    badge: 'ARCA / AFIP',
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
  { icon: TrendingDown,   text: 'No sabés cuánto vendiste realmente hasta que contás la caja a fin del día' },
  { icon: AlertTriangle,  text: 'Te quedás sin stock de lo que más vendés y no te enterás a tiempo' },
  { icon: Receipt,        text: 'Hacer una factura AFIP te lleva varios minutos buscando el portal y las claves' },
  { icon: Clock,          text: 'Perdés plata por fiar sin llevar un registro claro de lo que te deben' },
]

const PLANS = [
  {
    name: 'Simple',
    icon: Zap,
    pricePromo: 30000,
    priceFull: 60000,
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
    priceLabel: null as string | null,
    features: ['Todo lo del plan Simple', 'Facturación AFIP (A, B y C) con CAE', 'Reportes de ventas y caja', 'Gestión de proveedores', 'Actualización masiva de precios', 'Historial de cambios de precio'],
    cta: 'Suscribirme',
    href: '/registro',
    highlight: true,
  },
  {
    name: 'Profesional',
    icon: Star,
    pricePromo: null as number | null,
    priceFull: null as number | null,
    priceLabel: 'A consultar',
    features: ['Todo lo del plan Con Facturación', 'Múltiples sucursales', 'Equipo con roles (dueño, admin, cajero)', 'Reportes por sucursal y empleado', 'Notificaciones push de stock', 'Soporte prioritario por WhatsApp'],
    cta: 'Consultanos',
    href: '/#contacto',
    highlight: false,
  },
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
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-emerald-50/80 blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-16 md:pt-32 md:pb-20">
          {/* Badge — sin opacity inline, usa fill-mode: both del CSS */}
          <div className="flex justify-center mb-8 animate-fade-in" style={{ animationDelay: '0ms' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200 bg-emerald-50 shadow-sm">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                50% off los primeros 3 meses · Sin tarjeta de crédito
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
                  className="inline-flex items-center gap-2 h-12 px-8 rounded-xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Empezar gratis 14 días <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#precios"
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl text-base font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all"
                >
                  Ver planes
                </Link>
              </div>

              <p
                className="mt-5 text-xs text-slate-500 text-center lg:text-left animate-fade-in"
                style={{ animationDelay: '360ms' }}
              >
                Sin permanencia · Cancelás cuando querés · Hecho en Argentina 🇦🇷
              </p>
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
      <div className="overflow-hidden border-y border-slate-100 bg-slate-50 py-5">
        <div className="flex w-max animate-marquee">
          {/* Copy 1 */}
          <div className="flex items-center gap-4 pr-4">
            {INTEGRATIONS.map(item => {
              const Icon = item.icon
              return (
                <div key={item.name} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white shadow-sm">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{item.name}</span>
                </div>
              )
            })}
          </div>
          {/* Copy 2 — idéntica, sin aria */}
          <div className="flex items-center gap-4 pr-4" aria-hidden>
            {INTEGRATIONS.map(item => {
              const Icon = item.icon
              return (
                <div key={item.name} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 bg-white shadow-sm">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: item.color }} />
                  <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">{item.name}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ─── PAIN POINTS ─── */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <AnimateIn className="text-center mb-12">
          <p className="inline-flex items-center gap-2 text-xs font-bold text-red-500 uppercase tracking-widest mb-4">
            <span className="w-8 h-px bg-red-300" />¿Te suena familiar?<span className="w-8 h-px bg-red-300" />
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
            Manejás tu negocio a ciegas
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-lg mx-auto">
            Sin un sistema, cada día perdés tiempo y plata sin darte cuenta.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PAINS.map((p, i) => {
            const Icon = p.icon
            return (
              <AnimateIn key={p.text} delay={i * 80}>
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50 border border-red-100">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed pt-1">{p.text}</p>
                </div>
              </AnimateIn>
            )
          })}
        </div>

        <AnimateIn delay={320} className="text-center mt-8">
          <p className="text-sm text-slate-500">
            Con Ventix, todo eso desaparece.{' '}
            <Link href="/registro" className="text-emerald-600 font-semibold hover:underline underline-offset-2">
              Probalo gratis →
            </Link>
          </p>
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
          const planLabel = feat.badge
            ? 'Plan Con Facturación y Profesional'
            : 'Incluido en todos los planes'
          return (
            <div key={feat.num} className={`flex flex-col gap-10 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center`}>
              <AnimateIn from={isEven ? 'left' : 'right'} className="flex-1 space-y-5">
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-black text-slate-300 leading-none select-none">{feat.num}</span>
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
                  <p className="text-xs text-slate-400 text-center mt-1">{planLabel}</p>
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
          <div className="rounded-3xl bg-emerald-600 px-8 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { n: '< 3s',   label: 'para completar una venta' },
                { n: '14 días', label: 'de prueba gratuita'       },
                { n: '100%',   label: 'hecho para Argentina'      },
                { n: '0',      label: 'instalaciones requeridas'  },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-3xl md:text-4xl font-black text-white">{s.n}</p>
                  <p className="text-xs text-emerald-200 mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
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
      <section className="max-w-5xl mx-auto px-4 py-16" id="precios">
        <AnimateIn className="text-center mb-12">
          <p className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-4">
            <span className="w-8 h-px bg-emerald-300" />Precios<span className="w-8 h-px bg-emerald-300" />
          </p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Planes simples, sin sorpresas</h2>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200">
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

        <AnimateIn delay={300}>
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 flex items-center gap-4 max-w-2xl mx-auto">
            <Image src="/mercadopago-icon.png" alt="Mercado Pago" width={40} height={40} className="shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-800">Pagás con Mercado Pago</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Débito, crédito o transferencia. Mensual automático. Los primeros 3 meses al precio promocional, luego el precio regular. Cancelás cuando querés.
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
                href="https://wa.me/543585123456?text=Hola!%20Quiero%20saber%20m%C3%A1s%20sobre%20Ventix"
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
            <div className="pointer-events-none absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative">
              <p className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest mb-5">
                <span className="w-6 h-px bg-emerald-600" />Probalo ahora<span className="w-6 h-px bg-emerald-600" />
              </p>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                14 días gratis.<br />
                <span className="text-emerald-400">Sin tarjeta.</span>
              </h2>
              <p className="mt-4 text-slate-400 text-base max-w-sm mx-auto">
                Sin permanencia. Sin compromisos. Cancelás cuando querés.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 mt-8 h-12 px-10 rounded-xl text-base font-black text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all hover:shadow-xl hover:shadow-emerald-900/30 hover:-translate-y-0.5"
              >
                Crear mi cuenta gratis <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </AnimateIn>
      </section>
    </>
  )
}
