'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type TableName = 'products' | 'sales' | 'cash_sessions' | 'cash_movements'

/**
 * Suscribe a cambios (INSERT/UPDATE/DELETE) de una tabla filtrados por
 * organization_id vía Supabase Realtime y dispara `onChange` cuando llegan.
 *
 * El callback se debounce 250ms para coalescer ráfagas (p.ej. una venta que
 * toca varios productos) en un solo refetch. Pensado para que varias cajas
 * vean stock/ventas/caja al instante sin refrescar la página.
 */
export function useRealtime(
  table: TableName,
  orgId: string | undefined,
  onChange: () => void,
) {
  // Guardamos onChange en un ref para no re-suscribir en cada render.
  const cbRef = useRef(onChange)
  cbRef.current = onChange

  useEffect(() => {
    if (!orgId) return
    const supabase = createClient()
    let timer: ReturnType<typeof setTimeout> | null = null

    const channel = supabase
      .channel(`rt:${table}:${orgId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: `organization_id=eq.${orgId}` },
        () => {
          if (timer) clearTimeout(timer)
          timer = setTimeout(() => cbRef.current(), 250)
        },
      )
      .subscribe()

    return () => {
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [table, orgId])
}
