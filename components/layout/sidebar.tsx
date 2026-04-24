'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, FileText,
  Users, Briefcase, CreditCard, BarChart3, Settings,
  Bell, DollarSign, TrendingUp, Receipt, ChevronRight,
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
        navItem('Dashboard', `${base}/dashboard`, <LayoutDashboard className="h-[15px] w-[15px]" />),
        navItem('Punto de Venta', `${base}/pos`, <ShoppingCart className="h-[15px] w-[15px]" />),
        navItem('Ventas', `${base}/ventas`, <TrendingUp className="h-[15px] w-[15px]" />),
      ],
    },
    {
      title: 'INVENTARIO',
      items: [
        navItem('Productos', `${base}/productos`, <Package className="h-[15px] w-[15px]" />),
        navItem('Proveedores', `${base}/proveedores`, <Briefcase className="h-[15px] w-[15px]" />),
      ],
    },
    {
      title: 'FINANZAS',
      items: [
        navItem('Caja', `${base}/caja`, <DollarSign className="h-[15px] w-[15px]" />),
        navItem('Gastos', `${base}/gastos`, <Receipt className="h-[15px] w-[15px]" />),
        navItem('Facturación', `${base}/facturacion`, <FileText className="h-[15px] w-[15px]" />),
      ],
    },
    {
      title: 'CLIENTES',
      items: [
        navItem('Clientes', `${base}/clientes`, <Users className="h-[15px] w-[15px]" />),
        navItem('Cuentas Corrientes', `${base}/cuentas-corrientes`, <CreditCard className="h-[15px] w-[15px]" />),
      ],
    },
    {
      title: 'ANÁLISIS',
      items: [
        navItem('Reportes', `${base}/reportes`, <BarChart3 className="h-[15px] w-[15px]" />),
      ],
    },
  ]

  const bottomItems: NavItem[] = [
    navItem('Notificaciones', `${base}/notificaciones`, <Bell className="h-[15px] w-[15px]" />),
    navItem('Configuración', `${base}/configuracion`, <Settings className="h-[15px] w-[15px]" />),
  ]

  function NavLink({ item }: { item: NavItem }) {
    const active = pathname === item.href || pathname.startsWith(item.href + '/')
    return (
      <Link
        href={item.href}
        className={cn(
          'group relative flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[13px] font-medium transition-all duration-150 select-none',
          active
            ? 'text-white'
            : 'text-[#5a6480] hover:text-[#b0b8d4] hover:bg-white/[0.04]'
        )}
      >
        {active && (
          <>
            <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-violet-500/[0.18] via-violet-500/[0.08] to-transparent" />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[18px] rounded-r-full bg-gradient-to-b from-violet-400 to-indigo-500" />
          </>
        )}
        <span className={cn(
          'relative z-10 shrink-0 transition-colors',
          active ? 'text-violet-400' : 'text-[#3d4562] group-hover:text-[#6e7a9f]'
        )}>
          {item.icon}
        </span>
        <span className="relative z-10 truncate">{item.label}</span>
        {active && <ChevronRight className="relative z-10 ml-auto h-3 w-3 text-violet-500/50 shrink-0" />}
      </Link>
    )
  }

  return (
    <aside className={cn(
      'flex flex-col h-full bg-[#070910] border-r border-white/[0.05]',
      className
    )}>
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b border-white/[0.05] shrink-0">
        <Link href={`${base}/dashboard`} className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0"
               style={{ boxShadow: '0 0 12px oklch(0.64 0.26 278 / 40%)' }}>
            <span className="text-white text-[11px] font-black">V</span>
          </div>
          <span className="text-[18px] font-black tracking-[-0.05em] gradient-text leading-none">venti</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <nav className="px-2.5 space-y-5">
          {sections.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.1em] text-[#2e3654] uppercase">
                  {section.title}
                </p>
              )}
              <div className="space-y-[2px]">
                {section.items.map(it => (
                  <NavLink key={it.href} item={it} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom items */}
      <div className="px-2.5 pb-4 border-t border-white/[0.05] pt-3 space-y-[2px]">
        {bottomItems.map(it => (
          <NavLink key={it.href} item={it} />
        ))}
      </div>
    </aside>
  )
}
