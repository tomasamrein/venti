'use client'

import { useEffect, useState, useCallback } from 'react'
import { drainSyncQueue, syncProducts, syncCashSession } from '@/lib/offline/sync'

export function useOffline(orgId?: string, branchId?: string) {
  const [isOffline, setIsOffline] = useState(false)

  const syncAll = useCallback(() => {
    if (orgId) syncProducts(orgId).catch(console.error)
    if (branchId) syncCashSession(branchId).catch(console.error)
  }, [orgId, branchId])

  const handleOnline = useCallback(() => {
    setIsOffline(false)
    drainSyncQueue().catch(console.error)
    syncAll()
  }, [syncAll])

  const handleOffline = useCallback(() => setIsOffline(true), [])

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    if (navigator.onLine) syncAll()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [handleOnline, handleOffline, syncAll])

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
