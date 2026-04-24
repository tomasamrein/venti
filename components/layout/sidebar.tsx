'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ShoppingCart, Package, FileText,
  Users, Briefcase, CreditCard, BarChart3, Settings,
  Bell, DollarSign, TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

interface SidebarProps {
  orgSlug: string
  className?: string
}

function navItem(label: string, href: string, icon: React.ReactNode) {
  return { label, href, icon }
}

export function Sidebar({ orgSlug, className }: SidebarProps) {
  const pathname = usePathname()
  const base = `/${orgSlug}`

  const items = [
    navItem('Dashboard', `${base}/dashboard`, <LayoutDashboard className="h-4 w-4" />),
    navItem('Punto de Venta', `${base}/pos`, <ShoppingCart className="h-4 w-4" />),
    navItem('Productos', `${base}/productos`, <Package className="h-4 w-4" />),
    navItem('Ventas', `${base}/ventas`, <TrendingUp className="h-4 w-4" />),
    navItem('Facturación', `${base}/facturacion`, <FileText className="h-4 w-4" />),
    navItem('Caja', `${base}/caja`, <DollarSign className="h-4 w-4" />),
    navItem('Clientes', `${base}/clientes`, <Users className="h-4 w-4" />),
    navItem('Ctas. Corrientes', `${base}/cuentas-corrientes`, <CreditCard className="h-4 w-4" />),
    navItem('Proveedores', `${base}/proveedores`, <Briefcase className="h-4 w-4" />),
    navItem('Reportes', `${base}/reportes`, <BarChart3 className="h-4 w-4" />),
  ]

  const bottomItems = [
    navItem('Notificaciones', `${base}/notificaciones`, <Bell className="h-4 w-4" />),
    navItem('Configuración', `${base}/configuracion`, <Settings className="h-4 w-4" />),
  ]

  return (
    <aside className={cn('flex flex-col h-full bg-card border-r', className)}>
      {/* Logo */}
      <div className="h-14 flex items-center px-5 border-b shrink-0">
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tight font-poppins">venti</span>
      </div>

      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-0.5">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="px-3 pb-4 border-t pt-3 space-y-0.5">
        {bottomItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
