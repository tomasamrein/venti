'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, LogOut } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ADMIN_NAV } from './admin-nav'
import { Logo } from '@/components/ui/logo'

interface Props {
  displayName: string
}

export function AdminMobileNav({ displayName }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const nav = ADMIN_NAV

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-9 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <aside className="relative z-10 w-64 flex flex-col bg-zinc-900 border-r border-zinc-800 h-full">
            <div className="px-4 py-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Logo variant="icon" iconSize={28} />
                <div>
                  <p className="text-[13px] font-bold text-zinc-100 leading-none">Ventix Admin</p>
                  <p className="text-[11px] text-red-400 font-semibold mt-0.5">Super Admin</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex-1 px-2 py-3 space-y-0.5">
              {nav.map(item => {
                const Icon = item.icon
                const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
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

            <div className="px-2 py-4 border-t border-zinc-800">
              <p className="text-[11px] text-zinc-500 px-3 mb-2 truncate">{displayName}</p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors w-full"
              >
                <LogOut className="h-3.5 w-3.5" />
                Salir
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
