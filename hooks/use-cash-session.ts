'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/use-org'
import type { Database } from '@/types/database'

type CashSession = Database['public']['Tables']['cash_sessions']['Row']

export function useCashSession() {
  const { org, branch } = useOrg()
  const supabase = createClient()
  const queryClient = useQueryClient()

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
      return data as CashSession | null
    },
    enabled: !!branch?.id,
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

  return {
    session: query.data,
    isOpen: !!query.data,
    isLoading: query.isLoading,
    openSession,
    closeSession,
  }
}
