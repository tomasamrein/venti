'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Building2, ChevronDown } from 'lucide-react'

interface Branch { id: string; name: string }

interface DashboardFiltersProps {
  orgSlug: string
  isPro: boolean
  branches: Branch[]
  activePeriod: string
  activeBranchId: string | null
}

const PERIODS = [
  { key: 'day', label: 'Hoy' },
  { key: 'month', label: 'Este mes' },
  { key: 'year', label: 'Este año' },
]

export function DashboardFilters({ orgSlug, isPro, branches, activePeriod, activeBranchId }: DashboardFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const navigate = useCallback((period: string, branch?: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', period)
    if (branch !== undefined) {
      if (branch) params.set('branch', branch)
      else params.delete('branch')
    }
    router.push(`/${orgSlug}/dashboard?${params.toString()}`)
  }, [router, searchParams, orgSlug])

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Period tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border">
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => navigate(p.key)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activePeriod === p.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Branch selector — only pro */}
      {isPro && branches.length > 1 && (
        <div className="relative">
          <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <select
            value={activeBranchId ?? 'all'}
            onChange={e => navigate(activePeriod, e.target.value === 'all' ? null : e.target.value)}
            className="pl-8 pr-7 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">Todas las sucursales</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
        </div>
      )}
    </div>
  )
}
