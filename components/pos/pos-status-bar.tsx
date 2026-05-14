'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, Receipt, Clock, Wifi, WifiOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'

interface PosStatusBarProps {
  orgId: string
  branchId: string
  sessionId?: string
  isOpen: boolean
  isOffline: boolean
}

interface DayStats {
  sales: number
  totalRevenue: number
  cashInDrawer: number
}

export function PosStatusBar({ orgId, branchId, sessionId, isOpen, isOffline }: PosStatusBarProps) {
  const [stats, setStats] = useState<DayStats>({ sales: 0, totalRevenue: 0, cashInDrawer: 0 })
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!sessionId || isOffline) return
    const supabase = createClient()
    const today = new Date(); today.setHours(0, 0, 0, 0)

    async function load() {
      const { data: sales } = await supabase
        .from('sales')
        .select('total, payment_method')
        .eq('organization_id', orgId)
        .eq('branch_id', branchId)
        .eq('status', 'completed')
        .gte('created_at', today.toISOString())

      const list = sales ?? []
      const totalRevenue = list.reduce((s, r) => s + Number(r.total ?? 0), 0)
      const cashInDrawer = list.filter(r => r.payment_method === 'cash')
        .reduce((s, r) => s + Number(r.total ?? 0), 0)
      setStats({ sales: list.length, totalRevenue, cashInDrawer })
    }
    load()
    const channel = supabase
      .channel(`pos-status:${branchId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'sales',
        filter: `branch_id=eq.${branchId}`,
      }, load)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orgId, branchId, sessionId, isOffline])

  return (
    <div className="hidden md:flex items-center gap-3 px-4 py-2 border-b border-border/60 bg-background shrink-0">
      {/* Status pill */}
      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
        isOpen
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900'
          : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        {isOpen ? 'Caja abierta' : 'Caja cerrada'}
      </div>

      <div className="w-px h-5 bg-border" />

      {/* Metrics */}
      <div className="flex-1 flex items-center gap-5 overflow-x-auto">
        <Metric icon={Receipt} label="Ventas" value={stats.sales.toString()} tone="slate" />
        <Metric icon={TrendingUp} label="Facturado" value={formatARS(stats.totalRevenue)} tone="emerald" />
        <Metric icon={Wallet} label="Efectivo" value={formatARS(stats.cashInDrawer)} tone="amber" />
      </div>

      {/* Network + clock */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          {isOffline ? (
            <><WifiOff className="h-3 w-3 text-red-500" /><span className="text-red-600 font-medium">Sin conexión</span></>
          ) : (
            <><Wifi className="h-3 w-3 text-emerald-500" /><span className="font-medium">En línea</span></>
          )}
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span className="font-mono tabular-nums font-medium">
            {time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

const TONES = {
  slate: { icon: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
  emerald: { icon: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  amber: { icon: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40' },
} as const

function Metric({ icon: Icon, label, value, tone }: {
  icon: React.ElementType
  label: string
  value: string
  tone: keyof typeof TONES
}) {
  const t = TONES[tone]
  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${t.bg}`}>
        <Icon className={`h-3 w-3 ${t.icon}`} />
      </div>
      <div className="flex items-baseline gap-1.5 leading-none">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
        <span className="text-[12px] font-bold text-foreground tabular-nums">{value}</span>
      </div>
    </div>
  )
}
