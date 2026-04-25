'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface NotificationBellProps {
  orgSlug: string
  organizationId: string
}

export function NotificationBell({ orgSlug, organizationId }: NotificationBellProps) {
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
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

    // Load initial unread count
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_read', false)
      .then(({ count }) => setUnreadCount(count ?? 0))

    // Real-time: listen for new notifications
    const channel = supabase
      .channel(`notifications:${organizationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          const n = payload.new as { title: string; body: string | null; type: string }
          setUnreadCount(c => c + 1)
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
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('is_read', false)
            .then(({ count }) => setUnreadCount(count ?? 0))
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
        className="h-8 w-8 text-[#5a6480] hover:text-white hover:bg-white/5 rounded-lg"
        onClick={() => router.push(`/${orgSlug}/notificaciones`)}
      >
        <Bell className="h-4 w-4" />
      </Button>
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center justify-center px-1 pointer-events-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </div>
  )
}
