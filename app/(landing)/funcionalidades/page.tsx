import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ShoppingCart, Receipt, Package, Users, BarChart3, Wifi,
  CreditCard, Bell, Building2,
  Smartphone, ChevronRight, Check,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Funcionalidades',
  description: 'Todo lo que incluye Venti: POS, facturación ARCA, stock, clientes, reportes y más.',
}

const SECTIONS = [
  {
    icon: ShoppingCart,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
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
    iconColor: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
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
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
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
    iconColor: 'text-pink-600',
    iconBg: 'bg-pink-100',
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
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
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
    iconColor: 'text-teal-600',
    iconBg: 'bg-teal-100',
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
    iconColor: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
    title: 'Multi-sucursal (Plan Enterprise)',
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
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-100',
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
    iconColor: 'text-teal-700',
    iconBg: 'bg-teal-100',
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
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
          Todo lo que incluye Venti
        </h1>
        <p className="mt-4 text-base text-slate-600 max-w-xl mx-auto">
          Sin módulos separados, sin addons. Todo en un solo precio.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map(s => {
          const Icon = s.icon
          return (
            <div key={s.title} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100">
                <div className={`w-10 h-10 rounded-lg ${s.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">{s.title}</h2>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </div>
              </div>
              <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {s.features.map(f => (
                  <div key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-14 rounded-xl border border-emerald-200 bg-emerald-50 p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Probalo gratis 7 días</h2>
        <p className="mt-2 text-sm text-slate-600">Sin tarjeta de crédito. Sin compromiso.</p>
        <Link
          href="/registro"
          className="inline-flex items-center gap-2 mt-6 h-11 px-7 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          Crear cuenta gratis <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
