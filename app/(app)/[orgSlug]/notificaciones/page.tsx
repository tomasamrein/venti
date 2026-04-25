'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, AlertTriangle, Package, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  low_stock: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  out_of_stock: { icon: Package, color: 'text-red-400', bg: 'bg-red-500/10' },
  subscription: { icon: Bell, color: 'text-violet-400', bg: 'bg-violet-500/10' },
  price_change: { icon: Bell, color: 'text-blue-400', bg: 'bg-blue-500/10' },
}

export default function NotificacionesPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [fetching, setFetching] = useState(true)
  const [orgId, setOrgId] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
      if (!org) return
      setOrgId(org.id)

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(50)
      setNotifications(data ?? [])
      setFetching(false)
    }
    load()
  }, [orgSlug])

  async function markAllRead() {
    if (!orgId) return
    const supabase = createClient()
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('organization_id', orgId)
      .eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    toast.success('Todas marcadas como leídas')
  }

  async function markRead(id: string) {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (fetching) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-48 rounded-lg bg-white/[0.05] animate-pulse" />
        {[1, 2, 3].map(i => <div key={i} className="rounded-xl border border-white/[0.07] bg-card h-16 animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Notificaciones</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-[13px] rounded-lg" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        {!notifications.length ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-violet-400" />
            </div>
            <p className="text-[14px] font-medium">Sin notificaciones</p>
            <p className="text-[13px] text-muted-foreground mt-1">Te avisaremos cuando haya alertas de stock u otros eventos</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {notifications.map(n => {
              const typeInfo = TYPE_ICONS[n.type] ?? { icon: Bell, color: 'text-violet-400', bg: 'bg-violet-500/10' }
              const Icon = typeInfo.icon
              return (
                <div
                  key={n.id}
                  className={`px-5 py-4 flex items-start gap-3 transition-colors cursor-pointer hover:bg-white/[0.02] ${!n.is_read ? 'bg-white/[0.015]' : ''}`}
                  onClick={() => !n.is_read && markRead(n.id)}
                >
                  <div className={`w-8 h-8 rounded-lg ${typeInfo.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className={`h-4 w-4 ${typeInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[14px] font-medium ${n.is_read ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" />
                      )}
                    </div>
                    {n.body && <p className="text-[13px] text-muted-foreground mt-0.5">{n.body}</p>}
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400 shrink-0">Nueva</Badge>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
