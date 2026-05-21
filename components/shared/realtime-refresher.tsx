'use client'

import { useRouter } from 'next/navigation'
import { useRealtime } from '@/hooks/use-realtime'

type TableName = 'products' | 'sales' | 'cash_sessions' | 'cash_movements'

/**
 * Monta en un Server Component para que se re-renderice (router.refresh) cuando
 * cambia una tabla vía Supabase Realtime. No renderiza nada.
 */
export function RealtimeRefresher({ table, orgId }: { table: TableName; orgId: string }) {
  const router = useRouter()
  useRealtime(table, orgId, () => router.refresh())
  return null
}
