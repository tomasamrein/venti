import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShoppingCart, Receipt, Package, Users, BarChart3, Wifi,
  CreditCard, Bell, Building2, Printer, FileSpreadsheet,
  Smartphone, ChevronRight, Check,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Funcionalidades',
  description: 'Todo lo que incluye Venti: POS, facturación ARCA, stock, clientes, reportes y más.',
}

const SECTIONS = [
  {
    icon: ShoppingCart,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    title: 'Punto de Venta (POS)',
    desc: 'Diseñado para vender rápido, incluso en las horas pico.',
    features: [
      'Búsqueda de productos por nombre o código de barras',
      'Escáner USB HID — detecta lectores automáticamente',
      'Escáner por cámara del celular',
      'Carrito con descuentos por ítem o total',
      'Cobro en efectivo con cálculo de vuelto automático',
      'Cobro con débito, crédito, transferencia y Mercado Pago',
      'Cobro mixto (parte efectivo, parte tarjeta)',
      'Ventas en espera (multi-venta simultánea)',
      'Ticket por pantalla con opción de compartir por WhatsApp',
      'Funciona 100% offline sin internet',
    ],
  },
  {
    icon: Receipt,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    title: 'Facturación ARCA (ex-AFIP)',
    desc: 'Facturás legalmente sin salir de la caja.',
    features: [
      'Facturas A, B y C con CAE al instante',
      'Conectás CUIT y certificado una sola vez',
      'Ambientes homologación y producción',
      'Ticket no fiscal para operaciones sin comprobante',
      'QR AFIP estándar en cada factura',
      'Vista de factura con opción de imprimir',
      'Compartir factura por WhatsApp',
      'Historial de todas las facturas emitidas',
    ],
  },
  {
    icon: Package,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    title: 'Gestión de productos y stock',
    desc: 'Sabés exactamente qué tenés y qué te falta.',
    features: [
      'Catálogo ilimitado de productos',
      'Categorías y subcategorías',
      'Control de stock con umbral mínimo personalizable',
      'Alertas automáticas de stock bajo y sin stock',
      'Actualización masiva de precios por porcentaje',
      'Importación de precios desde Excel (.xlsx)',
      'Historial de cambios de precio por producto',
      'Impresión de etiquetas con código de barras',
      'Foto de producto',
      'SKU y código de barras propio',
    ],
  },
  {
    icon: Users,
    color: 'text-pink-400',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    title: 'Clientes y cuentas corrientes',
    desc: 'Controlás las deudas sin papel ni cuaderno.',
    features: [
      'Registro de clientes con datos completos',
      'Cuenta corriente por cliente',
      'Fiado en ventas: carga directa a la cuenta',
      'Registro de pagos con historial',
      'Estado de cuenta exportable',
      'Alerta de clientes con saldo elevado',
      'Búsqueda por nombre, DNI o teléfono',
    ],
  },
  {
    icon: BarChart3,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    title: 'Reportes y dashboard',
    desc: 'Los números de tu negocio en tiempo real.',
    features: [
      'Dashboard con ventas del día, semana y mes',
      'Gráfico de ventas diarias (AreaChart)',
      'Top 5 productos más vendidos',
      'Reporte de ventas con filtro por fecha y medio de pago',
      'Reporte de stock con valor de inventario',
      'Reporte de sesiones de caja con diferencias',
      'Exportar a CSV y Excel',
      'Alertas de stock activas en el dashboard',
    ],
  },
  {
    icon: CreditCard,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    title: 'Caja',
    desc: 'Apertura, cierre y control completo de cada turno.',
    features: [
      'Apertura con monto inicial declarado',
      'Registro de todos los movimientos del turno',
      'Ingreso de gastos desde caja',
      'Cierre con conteo real vs esperado',
      'Diferencia automática al cierre',
      'Historial de sesiones anteriores',
      'Una sola caja abierta por sucursal a la vez',
    ],
  },
  {
    icon: Building2,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    title: 'Multi-sucursal (Plan Pro)',
    desc: 'Manejás toda la cadena desde un solo lugar.',
    features: [
      'Sucursales ilimitadas',
      'Dashboard consolidado con todas las sucursales',
      'Reportes comparativos entre sucursales',
      'Usuarios asignados por sucursal',
      'Stock independiente por sucursal',
      'Facturas por punto de venta AFIP',
    ],
  },
  {
    icon: Bell,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    title: 'Notificaciones',
    desc: 'Te avisamos antes de que sea un problema.',
    features: [
      'Alertas in-app de stock bajo y sin stock',
      'Notificaciones push en el celular',
      'Centro de notificaciones con historial',
      'Sonido de alerta configurable',
    ],
  },
  {
    icon: Wifi,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    title: 'Modo offline y PWA',
    desc: 'Seguís vendiendo aunque se corte internet.',
    features: [
      'POS completamente funcional sin conexión',
      'Sincronización automática al recuperar internet',
      'Instalable como app en el celular (PWA)',
      'Carga instantánea en visitas repetidas',
    ],
  },
]

export default function FuncionalidadesPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <h1 className="text-[42px] md:text-[56px] font-extrabold tracking-[-0.04em] text-white">
          Todo lo que incluye Venti
        </h1>
        <p className="mt-4 text-[16px] text-[#5a6480] max-w-xl mx-auto">
          Sin módulos separados, sin addons. Todo en un solo precio.
        </p>
      </div>

      <div className="space-y-5">
        {SECTIONS.map(s => {
          const Icon = s.icon
          return (
            <div key={s.title}
              className={`rounded-2xl border ${s.border} bg-white/[0.02] overflow-hidden`}>
              <div className="px-6 py-5 flex items-center gap-4 border-b border-white/[0.05]">
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <h2 className="text-[16px] font-bold text-white">{s.title}</h2>
                  <p className="text-[13px] text-[#5a6480]">{s.desc}</p>
                </div>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {s.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check className={`h-4 w-4 ${s.color} shrink-0 mt-0.5`} />
                    <span className="text-[13px] text-[#8891a8]">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-14 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-10 text-center">
        <h2 className="text-[28px] font-extrabold text-white">Probalo gratis 14 días</h2>
        <p className="mt-2 text-[14px] text-[#5a6480]">Sin tarjeta de crédito. Sin compromiso.</p>
        <Link
          href="/registro"
          className="inline-flex items-center gap-2 mt-6 h-11 px-7 rounded-xl text-[14px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }}
        >
          Crear cuenta gratis <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
