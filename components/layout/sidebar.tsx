'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, FileText,
  Users, Briefcase, CreditCard, BarChart3, Settings,
  Bell, DollarSign, TrendingUp, Receipt,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const base = `/${orgSlug}`

  const sections: NavSection[] = [
    {
      items: [
        navItem('Dashboard', `${base}/dashboard`, <LayoutDashboard className="h-4 w-4" />),
        navItem('Punto de Venta', `${base}/pos`, <ShoppingCart className="h-4 w-4" />),
        navItem('Ventas', `${base}/ventas`, <TrendingUp className="h-4 w-4" />),
      ],
    },
    {
      title: 'Inventario',
      items: [
        navItem('Productos', `${base}/productos`, <Package className="h-4 w-4" />),
        navItem('Proveedores', `${base}/proveedores`, <Briefcase className="h-4 w-4" />),
      ],
    },
    {
      title: 'Finanzas',
      items: [
        navItem('Caja', `${base}/caja`, <DollarSign className="h-4 w-4" />),
        navItem('Gastos', `${base}/gastos`, <Receipt className="h-4 w-4" />),
        navItem('Facturación', `${base}/facturacion`, <FileText className="h-4 w-4" />),
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
        navItem('Reportes', `${base}/reportes`, <BarChart3 className="h-4 w-4" />),
      ],
    },
  ]

  const bottomItems: NavItem[] = [
    navItem('Notificaciones', `${base}/notificaciones`, <Bell className="h-4 w-4" />),
    navItem('Configuración', `${base}/configuracion`, <Settings className="h-4 w-4" />),
  ]

  function NavLink({ item }: { item: NavItem }) {
    const active = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
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
      <div className="h-14 flex items-center px-5 border-b border-border shrink-0">
        <Link href={`${base}/dashboard`}>
          <Image src="/logo-light.png" alt="Ventix" width={100} height={28} className="h-7 w-auto dark:invert" priority />
        </Link>
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
