'use client'

import { useEffect, useState, useCallback } from 'react'
import { drainSyncQueue } from '@/lib/offline/sync'

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false)

  const handleOnline = useCallback(() => {
    setIsOffline(false)
    drainSyncQueue().catch(console.error)
  }, [])

  const handleOffline = useCallback(() => setIsOffline(true), [])

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline])

  return isOffline
}

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('SW registration failed:', err)
    })
  }, [])
}
