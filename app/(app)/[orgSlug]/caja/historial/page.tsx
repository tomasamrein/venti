'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  params: Promise<{ orgSlug: string }>
}

interface SessionRow {
  id: string
  opened_at: string
  closed_at: string | null
  opening_amount: number
  closing_amount: number | null
  expected_amount: number | null
  difference: number | null
  status: string
  branches: { name: string } | null
}

export default function CajaHistorialPage({ params }: Props) {
  const [orgSlug, setOrgSlug] = useState('')
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(p => setOrgSlug(p.orgSlug))
  }, [params])

  const loadSessions = useCallback(async () => {
    if (!orgSlug) return
    const supabase = createClient()

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', orgSlug)
      .single()
    if (!org) return

    const { data } = await supabase
      .from('cash_sessions')
      .select('id, opened_at, closed_at, opening_amount, closing_amount, expected_amount, difference, status, branches(name)')
      .eq('organization_id', org.id)
      .order('opened_at', { ascending: false })
      .limit(50)

    setSessions((data as SessionRow[]) || [])
    setLoading(false)
  }, [orgSlug])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/${orgSlug}/caja`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Historial de caja</h1>
          <p className="text-sm text-muted-foreground">Sesiones anteriores</p>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Apertura</TableHead>
                <TableHead>Cierre</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-right">Inicial</TableHead>
                <TableHead className="text-right">Esperado</TableHead>
                <TableHead className="text-right">Real</TableHead>
                <TableHead className="text-right">Diferencia</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay sesiones registradas
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(s.opened_at), 'dd/MM/yy HH:mm', { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {s.closed_at
                        ? format(new Date(s.closed_at), 'dd/MM/yy HH:mm', { locale: es })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{s.branches?.name ?? '—'}</TableCell>
                    <TableCell className="text-right text-sm">{formatARS(s.opening_amount)}</TableCell>
                    <TableCell className="text-right text-sm">
                      {s.expected_amount != null ? formatARS(s.expected_amount) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {s.closing_amount != null ? formatARS(s.closing_amount) : '—'}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {s.difference != null ? (
                        <span className={s.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {s.difference >= 0 ? '+' : ''}{formatARS(s.difference)}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'open' ? 'default' : 'secondary'} className="text-xs">
                        {s.status === 'open' ? 'Abierta' : 'Cerrada'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
