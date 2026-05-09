'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useNotificationStore } from '@/stores/notification-store'

interface NotificationBellProps {
  orgSlug: string
  organizationId: string
}

export function NotificationBell({ orgSlug, organizationId }: NotificationBellProps) {
  const router = useRouter()
  const { unreadCount, setNotifications, addNotification } = useNotificationStore()
  const audioCtxRef = useRef<AudioContext | null>(null)

  function playAlert() {
    try {
      audioCtxRef.current ??= new AudioContext()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start()
      osc.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  useEffect(() => {
    const supabase = createClient()

    // Load initial notifications into store
    supabase
      .from('notifications')
      .select('id, type, title, body, data, is_read, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data.map(n => ({ ...n, data: (n.data as Record<string, unknown>) ?? undefined })))
      })

    // Real-time: listen for new notifications
    const channel = supabase
      .channel(`notifications:${organizationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          const n = payload.new as { id: string; type: string; title: string; body: string | null; data?: Record<string, unknown>; is_read: boolean; created_at: string }
          addNotification({ ...n, body: n.body ?? null, data: n.data ?? undefined })
          playAlert()
          toast(n.title, {
            description: n.body ?? undefined,
            icon: '🔔',
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `organization_id=eq.${organizationId}` },
        () => {
          supabase
            .from('notifications')
            .select('id, type, title, body, data, is_read, created_at')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(50)
            .then(({ data }) => {
              if (data) setNotifications(data.map(n => ({ ...n, data: (n.data as Record<string, unknown>) ?? undefined })))
            })
        }
      )
      .subscribe()

    // Real-time: listen for stock alerts
    const stockChannel = supabase
      .channel(`stock_alerts:${organizationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'stock_alerts', filter: `organization_id=eq.${organizationId}` },
        async (payload) => {
          const alert = payload.new as { product_id: string; alert_type: string; current_stock: number }
          const { data: product } = await supabase
            .from('products').select('name').eq('id', alert.product_id).single()
          const isOut = alert.alert_type === 'out_of_stock'
          playAlert()
          toast.warning(isOut ? 'Sin stock' : 'Stock bajo', {
            description: `${product?.name ?? 'Producto'} — ${isOut ? 'Agotado' : `${alert.current_stock} unidades`}`,
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(stockChannel)
    }
  }, [organizationId])  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
        onClick={() => router.push(`/${orgSlug}/notificaciones`)}
      >
        <Bell className="h-4 w-4" />
      </Button>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center px-1 pointer-events-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  )
}
