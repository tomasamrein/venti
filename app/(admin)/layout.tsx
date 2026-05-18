import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './logout-button'
import { AdminMobileNav } from './admin-mobile-nav'
import { AdminNavLinks } from './admin-nav-links'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_super_admin, full_name').eq('id', user.id).single()

  if (!profile?.is_super_admin) redirect('/admin/login')

  const displayName = profile.full_name ?? user.email ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col bg-zinc-900 border-r border-zinc-800">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/30 shrink-0">
              <span className="text-white text-sm font-black">V</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-zinc-100 leading-none">Ventix Admin</p>
              <p className="text-[11px] text-red-400 font-semibold mt-0.5">Super Admin</p>
            </div>
          </div>
        </div>

        <AdminNavLinks />

        {/* Footer */}
        <div className="px-2 py-4 border-t border-zinc-800 space-y-1">
          <p className="text-[11px] text-zinc-500 px-3 truncate">{displayName}</p>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Top bar mobile */}
        <header className="md:hidden h-14 flex items-center px-4 gap-3 border-b border-zinc-800 bg-zinc-900 shrink-0">
          <AdminMobileNav displayName={displayName} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-black">V</span>
            </div>
            <span className="text-[13px] font-bold text-zinc-100">Ventix Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
