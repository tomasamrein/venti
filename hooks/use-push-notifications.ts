'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'

export function usePushNotifications(organizationId: string) {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
    setPermission(typeof Notification !== 'undefined' ? Notification.permission : 'default')
  }, [])

  useEffect(() => {
    if (!supported) return
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        setSubscribed(!!sub)
      })
    }).catch(() => {})
  }, [supported])

  const subscribe = useCallback(async () => {
    if (!supported || !organizationId) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        toast.error('Permisos de notificación denegados')
        setLoading(false)
        return
      }

      const existing = await reg.pushManager.getSubscription()
      if (existing) await existing.unsubscribe()

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) { toast.error('VAPID key no configurada'); setLoading(false); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      })

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), organizationId }),
      })

      setSubscribed(true)
      toast.success('Notificaciones push activadas')
    } catch (err) {
      console.error('Push subscribe error:', err)
      toast.error('Error al activar notificaciones')
    }
    setLoading(false)
  }, [supported, organizationId])

  const unsubscribe = useCallback(async () => {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setSubscribed(false)
      toast.success('Notificaciones push desactivadas')
    } catch {
      toast.error('Error al desactivar notificaciones')
    }
    setLoading(false)
  }, [supported])

  return { supported, permission, subscribed, loading, subscribe, unsubscribe }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}
