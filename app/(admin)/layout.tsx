import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { LayoutDashboard, Building2, CreditCard, Users, LogOut } from 'lucide-react'

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Organizaciones', href: '/admin/organizaciones', icon: Building2 },
  { label: 'Suscripciones', href: '/admin/suscripciones', icon: CreditCard },
  { label: 'Usuarios', href: '/admin/usuarios', icon: Users },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_super_admin, full_name').eq('id', user.id).single()

  if (!profile?.is_super_admin) redirect('/')

  return (
    <div className="flex h-screen overflow-hidden bg-[#070910]">
      {/* Admin Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-white/[0.06] bg-[#07090f]">
        <div className="px-5 py-5 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-black">V</span>
            </div>
            <div>
              <p className="text-[13px] font-bold text-white">Venti Admin</p>
              <p className="text-[10px] text-red-400 font-semibold">Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-[#8891a8] hover:text-white hover:bg-white/5 transition-colors"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/[0.05]">
          <p className="text-[11px] text-muted-foreground px-3 mb-2 truncate">{profile.full_name ?? user.email}</p>
          <Link href="/login" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
            <LogOut className="h-4 w-4" />Salir
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        {children}
      </main>
    </div>
  )
}
