'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Moon, Sun, LogOut, Settings, Menu, BookOpen } from 'lucide-react'
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
import { NotificationBell } from '@/components/notifications/notification-bell'

interface TopNavProps {
  orgSlug: string
  organizationId: string
  userName?: string
  userAvatar?: string
  orgName?: string
  planType?: string
  trialEndsAt?: string
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free_trial: { label: 'Trial', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' },
  basic: { label: 'Basic', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800' },
  pro: { label: 'Pro', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' },
}

export function TopNav({ orgSlug, organizationId, userName, userAvatar, orgName, planType, trialEndsAt }: TopNavProps) {
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
    <header className="h-14 flex items-center px-4 gap-3 shrink-0 border-b border-border bg-background">
      {/* Mobile menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger render={
          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8">
            <Menu className="h-4 w-4" />
          </Button>
        } />
        <SheetContent side="left" className="p-0 w-60">
          <Sidebar orgSlug={orgSlug} className="h-full" />
        </SheetContent>
      </Sheet>

      {/* Org name + plan — visible en mobile, oculto en desktop (el sidebar ya lo muestra) */}
      {orgName && (
        <div className="flex items-center gap-2 md:hidden">
          <span className="text-[14px] font-bold truncate max-w-[140px]">{orgName}</span>
          {planType && PLAN_LABELS[planType] && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${PLAN_LABELS[planType].color}`}>
              {PLAN_LABELS[planType].label}
            </span>
          )}
        </div>
      )}

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        <Link
          href={`/${orgSlug}/docs`}
          aria-label="Documentación"
          title="Documentación"
          className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <BookOpen className="h-4 w-4" />
        </Link>

        <NotificationBell orgSlug={orgSlug} organizationId={organizationId} />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <button className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-muted transition-colors">
              <Avatar className="h-7 w-7">
                <AvatarImage src={userAvatar} alt={userName} />
                <AvatarFallback className="text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-muted-foreground hidden sm:block max-w-[120px] truncate">
                {userName?.split(' ')[0] || 'Mi cuenta'}
              </span>
            </button>
          } />
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold truncate">{userName || 'Mi cuenta'}</p>
              {orgName && <p className="text-[11px] text-muted-foreground truncate">{orgName}</p>}
              {planType && PLAN_LABELS[planType] && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${PLAN_LABELS[planType].color}`}>
                    {PLAN_LABELS[planType].label}
                  </span>
                  {planType === 'free_trial' && trialEndsAt && (() => {
                    const days = Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
                    return days > 0
                      ? <span className="text-[10px] text-amber-600">{days} días restantes</span>
                      : <span className="text-[10px] text-red-500">Trial vencido</span>
                  })()}
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(`/${orgSlug}/configuracion`)}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-3.5 w-3.5" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
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
