'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Moon, Sun, LogOut, Settings, Menu, Bell } from 'lucide-react'
import { useTheme } from 'next-themes'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'

interface TopNavProps {
  orgSlug: string
  userName?: string
  userAvatar?: string
}

export function TopNav({ orgSlug, userName, userAvatar }: TopNavProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userName
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <header className={cn(
      'h-14 flex items-center px-4 gap-3 shrink-0',
      'border-b border-white/[0.05]',
      'bg-[oklch(0.09_0.016_264)/80]',
      'backdrop-blur-xl',
      'dark:bg-[#0c0e14]/80',
    )}>
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 text-[#5a6480] hover:text-white hover:bg-white/5"
          >
            <Menu className="h-4 w-4" />
          </Button>
        } />
        <SheetContent side="left" className="p-0 w-60 border-r border-white/[0.05]">
          <Sidebar orgSlug={orgSlug} className="h-full" />
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#5a6480] hover:text-white hover:bg-white/5 rounded-lg"
          onClick={() => router.push(`/${orgSlug}/notificaciones`)}
        >
          <Bell className="h-4 w-4" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#5a6480] hover:text-white hover:bg-white/5 rounded-lg"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-[14px] w-[14px] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[14px] w-[14px] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Separator */}
        <div className="w-px h-5 bg-white/[0.07] mx-1" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-white/5 transition-colors group">
              <Avatar className="h-7 w-7 ring-1 ring-white/10">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-[10px] font-bold bg-gradient-to-br from-violet-500 to-indigo-600 text-white border-0">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[13px] font-medium text-[#8891a8] group-hover:text-white transition-colors hidden sm:block max-w-[120px] truncate">
                {userName?.split(' ')[0] || 'Mi cuenta'}
              </span>
            </button>
          } />
          <DropdownMenuContent
            align="end"
            className="w-52 bg-[#0f1320] border border-white/[0.08] shadow-xl shadow-black/50"
          >
            <div className="px-3 py-2">
              <p className="text-[13px] font-semibold text-white truncate">{userName || 'Mi cuenta'}</p>
            </div>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              onClick={() => router.push(`/${orgSlug}/configuracion`)}
              className="text-[#8891a8] hover:text-white focus:text-white hover:bg-white/5 focus:bg-white/5 cursor-pointer"
            >
              <Settings className="mr-2 h-3.5 w-3.5" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-400 hover:text-red-300 focus:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
