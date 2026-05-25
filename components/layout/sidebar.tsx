'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import {
  LayoutDashboard, ShoppingCart, Package, FileText,
  Users, Briefcase, CreditCard, BarChart3, Settings,
  Bell, DollarSign, TrendingUp, Receipt, ShoppingBag, Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrg } from '@/hooks/use-org'
import { hasInvoicing, isBusinessTier } from '@/lib/utils/plan'
import { isInventoryDisabled } from '@/lib/utils/org-settings'

interface SidebarProps {
  orgSlug: string
  className?: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface NavSection {
  title?: string
  items: NavItem[]
}

function navItem(label: string, href: string, icon: React.ReactNode): NavItem {
  return { label, href, icon }
}

export function Sidebar({ orgSlug, className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const base = `/${orgSlug}`
  const { role, org, planType } = useOrg()
  const isCashier = role === 'cashier'
  const noInventory = isInventoryDisabled(org.settings)

  const daysLeft = (() => {
    if (!org.trial_ends_at) return null
    const ms = new Date(org.trial_ends_at).getTime() - Date.now()
    return Math.ceil(ms / 86400000)
  })()

  const sections: NavSection[] = isCashier
    ? [{
        items: [
          navItem('Punto de Venta', `${base}/pos`, <ShoppingCart className="h-4 w-4" />),
          navItem('Caja', `${base}/caja`, <DollarSign className="h-4 w-4" />),
          ...(noInventory ? [] : [navItem('Productos', `${base}/productos`, <Package className="h-4 w-4" />)]),
          navItem('Clientes', `${base}/clientes`, <Users className="h-4 w-4" />),
          navItem('Cuentas Corrientes', `${base}/cuentas-corrientes`, <CreditCard className="h-4 w-4" />),
        ],
      }]
    : [
        {
          items: [
            navItem('Dashboard', `${base}/dashboard`, <LayoutDashboard className="h-4 w-4" />),
            navItem('Punto de Venta', `${base}/pos`, <ShoppingCart className="h-4 w-4" />),
            navItem('Caja', `${base}/caja`, <DollarSign className="h-4 w-4" />),
          ],
        },
        ...(noInventory ? [] : [{
          title: 'Inventario',
          items: [
            navItem('Productos', `${base}/productos`, <Package className="h-4 w-4" />),
            navItem('Compras sugeridas', `${base}/compras`, <ShoppingBag className="h-4 w-4" />),
            ...(isBusinessTier(planType)
              ? [navItem('Órdenes de compra', `${base}/compras/ordenes`, <Package className="h-4 w-4" />)]
              : []),
            navItem('Proveedores', `${base}/proveedores`, <Briefcase className="h-4 w-4" />),
          ],
        }]),
        {
          title: 'Finanzas',
          items: [
            navItem('Gastos', `${base}/gastos`, <Receipt className="h-4 w-4" />),
            ...(hasInvoicing(planType)
              ? [navItem('Facturación', `${base}/facturacion`, <FileText className="h-4 w-4" />)]
              : []),
          ],
        },
        {
          title: 'Clientes',
          items: [
            navItem('Clientes', `${base}/clientes`, <Users className="h-4 w-4" />),
            navItem('Cuentas Corrientes', `${base}/cuentas-corrientes`, <CreditCard className="h-4 w-4" />),
          ],
        },
        {
          title: 'Análisis',
          items: [
            navItem('Ventas', `${base}/ventas`, <TrendingUp className="h-4 w-4" />),
            navItem('Reportes', `${base}/reportes`, <BarChart3 className="h-4 w-4" />),
          ],
        },
      ]

  const bottomItems: NavItem[] = isCashier
    ? []
    : [
        navItem('Notificaciones', `${base}/notificaciones`, <Bell className="h-4 w-4" />),
        navItem('Configuración', `${base}/configuracion`, <Settings className="h-4 w-4" />),
        ...(role === 'owner' ? [navItem('Auditoría', `${base}/configuracion/auditoria`, <Shield className="h-4 w-4" />)] : []),
      ]

  function NavLink({ item }: { item: NavItem }) {
    const active = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        prefetch
        onMouseEnter={() => router.prefetch(item.href)}
        onTouchStart={() => router.prefetch(item.href)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors select-none',
          active
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
        )}
      >
        <span className={cn(
          'shrink-0',
          active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
        )}>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    )
  }

  return (
    <aside className={cn(
      'flex flex-col h-full bg-sidebar border-r border-border',
      className
    )}>
      {/* Logo */}
      <div className={`flex items-center px-5 border-b border-border shrink-0 ${planType === 'free_trial' && daysLeft !== null ? 'flex-col items-start gap-0.5 py-2.5' : 'h-14'}`}>
        <Link href={`${base}/dashboard`}>
          <Logo className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight" iconSize={28} />
        </Link>
        {planType === 'free_trial' && daysLeft !== null && (
          <p className={`text-[11px] font-semibold px-1 ${daysLeft <= 2 ? 'text-red-500' : 'text-amber-500'}`}>
            {Math.max(0, daysLeft)} días de prueba restantes
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <nav className="px-3 space-y-5">
          {sections.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="px-3 mb-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(it => (
                  <NavLink key={it.href} item={it} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom items */}
      <div className="px-3 pb-4 border-t border-border pt-3 space-y-0.5">
        {bottomItems.map(it => (
          <NavLink key={it.href} item={it} />
        ))}
      </div>
    </aside>
  )
}
