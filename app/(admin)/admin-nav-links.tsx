'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ADMIN_NAV } from './admin-nav'

export function AdminNavLinks() {
  const pathname = usePathname()
  const nav = ADMIN_NAV
  return (
    <nav className="flex-1 px-2 py-3 space-y-0.5">
      {nav.map(item => {
        const Icon = item.icon
        const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
              active
                ? 'bg-red-600/15 text-red-400 border border-red-600/20'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 border border-transparent'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
