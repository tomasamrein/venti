'use client'

import { useState, useEffect } from 'react'
import { Users, ChevronDown, Check, UserCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { usePosStore } from '@/stores/pos-store'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Member {
  user_id: string
  full_name: string | null
  role: string
}

interface EmployeeSwitcherProps {
  orgId: string
}

export function EmployeeSwitcher({ orgId }: EmployeeSwitcherProps) {
  const { activeCashierName, activeCashierId, setActiveCashier } = usePosStore()
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    const supabase = createClient()

    // Fetch members then join profiles manually (no direct FK to public.profiles)
    supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .then(async ({ data: memberData }) => {
        if (!memberData?.length) return

        const userIds = memberData.map(m => m.user_id)
        const [{ data: profileData }] = await Promise.all([
          supabase.from('profiles').select('id, full_name').in('id', userIds),
        ])

        const profileMap = new Map((profileData ?? []).map(p => [p.id, p.full_name]))

        setMembers(
          memberData.map(m => ({
            user_id: m.user_id,
            role: m.role,
            full_name: profileMap.get(m.user_id) ?? null,
          }))
        )
      })
  }, [orgId])

  function select(member: Member) {
    setActiveCashier(member.user_id, member.full_name ?? `Usuario ${member.user_id.slice(0, 6)}`)
  }

  const displayName = activeCashierName ?? 'Sin cajero'

  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/60 bg-background hover:bg-muted text-xs font-medium transition-colors"
      >
        <UserCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="max-w-[100px] truncate">{displayName}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1.5">
        <div className="flex items-center gap-2 px-2 py-1.5 mb-1 border-b border-border/60">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground">Cambiar cajero</span>
        </div>
        {members.length === 0 && (
          <p className="px-2 py-2 text-xs text-muted-foreground">Sin miembros encontrados</p>
        )}
        {members.map(member => {
          const name = member.full_name ?? `Usuario ${member.user_id.slice(0, 6)}`
          const isActive = activeCashierId === member.user_id
          return (
            <button
              key={member.user_id}
              onClick={() => select(member)}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm hover:bg-muted transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                  {name[0]}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-medium leading-tight truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
              </div>
              {isActive && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}
