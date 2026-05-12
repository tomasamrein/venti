'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/use-org'
import { db } from '@/lib/offline/db'
import type { Database } from '@/types/database'

type CashSession = Database['public']['Tables']['cash_sessions']['Row']

export function useCashSession() {
  const { org, branch } = useOrg()
  const supabase = createClient()
  const queryClient = useQueryClient()
  const [isOffline, setIsOffline] = useState(false)
  const [offlineSession, setOfflineSession] = useState<CashSession | null>(null)

  useEffect(() => {
    setIsOffline(!navigator.onLine)
    const onOnline = () => setIsOffline(false)
    const onOffline = () => setIsOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // When offline, read session from IndexedDB
  useEffect(() => {
    if (!isOffline || !branch?.id) return
    db.cash_sessions
      .where('branch_id').equals(branch.id)
      .filter(s => s.status === 'open')
      .first()
      .then(s => setOfflineSession(s as unknown as CashSession ?? null))
  }, [isOffline, branch?.id])

  const key = ['cash-session', branch?.id]

  const query = useQuery({
    queryKey: key,
    queryFn: async () => {
      if (!branch?.id) return null
      const { data } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('branch_id', branch.id)
        .eq('status', 'open')
        .single()
      // Cache in IndexedDB for offline use
      if (data) {
        await db.cash_sessions.put({
          id: data.id,
          organization_id: data.organization_id,
          branch_id: data.branch_id,
          opened_by: data.opened_by,
          opened_at: data.opened_at,
          opening_amount: data.opening_amount,
          status: data.status,
        })
      } else {
        await db.cash_sessions
          .where('branch_id').equals(branch.id)
          .modify({ status: 'closed' })
      }
      return data as CashSession | null
    },
    enabled: !!branch?.id && !isOffline,
    staleTime: 30_000,
  })

  const openSession = useMutation({
    mutationFn: async ({ opening_amount, notes }: { opening_amount: number; notes?: string }) => {
      if (!org?.id || !branch?.id) throw new Error('Sin contexto de org/sucursal')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { data, error } = await supabase
        .from('cash_sessions')
        .insert({
          organization_id: org.id,
          branch_id: branch.id,
          opened_by: user.id,
          opening_amount,
          notes: notes ?? null,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const closeSession = useMutation({
    mutationFn: async ({
      session_id,
      closing_amount,
      expected_amount,
      notes,
    }: {
      session_id: string
      closing_amount: number
      expected_amount: number
      notes?: string
    }) => {
      const difference = closing_amount - expected_amount
      const { data, error } = await supabase
        .from('cash_sessions')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
          closing_amount,
          expected_amount,
          difference,
          notes: notes ?? null,
        })
        .eq('id', session_id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  })

  const effectiveSession = isOffline ? offlineSession : (query.data ?? null)

  return {
    session: effectiveSession,
    isOpen: !!effectiveSession,
    isLoading: !isOffline && query.isLoading,
    openSession,
    closeSession,
  }
}
