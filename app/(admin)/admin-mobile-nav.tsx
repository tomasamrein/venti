'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LogOut } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface Props {
  nav: NavItem[]
  displayName: string
}

export function AdminMobileNav({ nav, displayName }: Props) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Drawer */}
          <aside className="relative z-10 w-64 flex flex-col bg-background border-r border-border h-full">
            <div className="px-5 py-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center">
                  <span className="text-white text-xs font-black">V</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Ventix Admin</p>
                  <p className="text-xs text-red-500 font-semibold">Super Admin</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {nav.map(item => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="px-3 py-4 border-t border-border">
              <p className="text-xs text-muted-foreground px-3 mb-2 truncate">{displayName}</p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
