'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors w-full"
    >
      <LogOut className="h-3.5 w-3.5" />
      Salir
    </button>
  )
}
