'use client'

import { useEffect, useState, useCallback } from 'react'
import { drainSyncQueue, syncProducts, syncCashSession } from '@/lib/offline/sync'
import { db } from '@/lib/offline/db'

export interface OfflineState {
  isOffline: boolean
  pendingCount: number
  isSyncing: boolean
}

export function useOfflineState(orgId?: string, branchId?: string): OfflineState {
  const [isOffline, setIsOffline] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const refreshCount = useCallback(async () => {
    try {
      const c = await db.sync_queue.count()
      setPendingCount(c)
    } catch {
      setPendingCount(0)
    }
  }, [])

  const syncAll = useCallback(async () => {
    if (orgId) syncProducts(orgId).catch(console.error)
    if (branchId) syncCashSession(branchId).catch(console.error)
  }, [orgId, branchId])

  const handleOnline = useCallback(async () => {
    setIsOffline(false)
    setIsSyncing(true)
    try {
      await drainSyncQueue()
      await syncAll()
    } finally {
      await refreshCount()
      setIsSyncing(false)
    }
  }, [syncAll, refreshCount])

  const handleOffline = useCallback(() => setIsOffline(true), [])

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    refreshCount()
    if (navigator.onLine) syncAll()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const interval = setInterval(refreshCount, 3000)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [handleOnline, handleOffline, syncAll, refreshCount])

  return { isOffline, pendingCount, isSyncing }
}

export function useOffline(orgId?: string, branchId?: string) {
  return useOfflineState(orgId, branchId).isOffline
}

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('SW registration failed:', err)
    })
  }, [])
}
