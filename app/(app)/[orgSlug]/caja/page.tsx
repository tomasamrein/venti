'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  DollarSign, Clock, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Plus, History
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useOrg } from '@/hooks/use-org'

interface CashSession {
  id: string
  organization_id: string
  branch_id: string
  opened_by: string
  opened_at: string
  opening_amount: number
  status: string
  notes: string | null
}

interface CashMovement {
  id: string
  type: string
  amount: number
  description: string | null
  created_at: string
}

export default function CajaPage() {
  const { org, branch, userId } = useOrg()
  const orgId = org.id
  const orgSlug = org.slug
  const selectedBranch = branch

  const [session, setSession] = useState<CashSession | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(true)

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [movementDialog, setMovementDialog] = useState(false)

  // Form states
  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [sessionNotes, setSessionNotes] = useState('')
  const [movementType, setMovementType] = useState<'deposit' | 'withdrawal' | 'expense'>('deposit')
  const [movementAmount, setMovementAmount] = useState('')
  const [movementDescription, setMovementDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const { data: openSession } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('branch_id', branch.id)
      .eq('status', 'open')
      .maybeSingle()

    setSession(openSession)

    if (openSession) {
      const { data: movs } = await supabase
        .from('cash_movements')
        .select('id, type, amount, description, created_at')
        .eq('session_id', openSession.id)
        .order('created_at', { ascending: false })
        .limit(50)

      setMovements(movs || [])
    }

    setLoading(false)
  }, [orgId, branch.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleOpenSession() {
    setSubmitting(true)
    try {
      const supabase = createClient()
      const amount = parseFloat(openingAmount) || 0

      const { data: newSession, error } = await supabase
        .from('cash_sessions')
        .insert({
          organization_id: orgId,
          branch_id: branch.id,
          opened_by: userId,
          opening_amount: amount,
          status: 'open',
          notes: sessionNotes || null,
        })
        .select()
        .single()

      if (error) throw error

      await supabase.from('cash_movements').insert({
        session_id: newSession.id,
        organization_id: orgId,
        branch_id: branch.id,
        type: 'opening',
        amount,
        description: 'Apertura de caja',
        created_by: userId,
      })

      toast.success('Caja abierta')
      setOpenDialog(false)
      setOpeningAmount('')
      setSessionNotes('')
      await loadData()
    } catch {
      toast.error('Error al abrir caja')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCloseSession() {
    if (!session) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const closingAmt = parseFloat(closingAmount) || 0
      const expectedAmt = getExpectedAmount()
      const diff = closingAmt - expectedAmt

      await supabase
        .from('cash_sessions')
        .update({
          status: 'closed',
          closed_by: userId,
          closed_at: new Date().toISOString(),
          closing_amount: closingAmt,
          expected_amount: expectedAmt,
          difference: diff,
        })
        .eq('id', session.id)

      await supabase.from('cash_movements').insert({
        session_id: session.id,
        organization_id: orgId,
        branch_id: session.branch_id,
        type: 'closing',
        amount: closingAmt,
        description: `Cierre de caja. Diferencia: ${formatARS(diff)}`,
        created_by: userId,
      })

      toast.success('Caja cerrada')
      setCloseDialog(false)
      setClosingAmount('')
      setSession(null)
      setMovements([])
      await loadData()
    } catch {
      toast.error('Error al cerrar caja')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddMovement() {
    if (!session || !movementAmount) return
    setSubmitting(true)
    try {
      const supabase = createClient()
      const amount = parseFloat(movementAmount)
      const signedAmount = movementType === 'withdrawal' || movementType === 'expense'
        ? -Math.abs(amount)
        : Math.abs(amount)

      await supabase.from('cash_movements').insert({
        session_id: session.id,
        organization_id: orgId,
        branch_id: session.branch_id,
        type: movementType,
        amount: signedAmount,
        description: movementDescription || null,
        created_by: userId,
      })

      toast.success('Movimiento registrado')
      setMovementDialog(false)
      setMovementAmount('')
      setMovementDescription('')
      await loadData()
    } catch {
      toast.error('Error al registrar movimiento')
    } finally {
      setSubmitting(false)
    }
  }

  function getExpectedAmount(): number {
    const salesTotal = movements
      .filter(m => m.type === 'sale' || m.type === 'deposit' || m.type === 'opening')
      .reduce((sum, m) => sum + m.amount, 0)
    const outTotal = movements
      .filter(m => m.type === 'expense' || m.type === 'withdrawal' || m.type === 'closing')
      .reduce((sum, m) => sum + Math.abs(m.amount), 0)
    return salesTotal - outTotal
  }

  const salesAmount = movements
    .filter(m => m.type === 'sale')
    .reduce((sum, m) => sum + m.amount, 0)

  const expensesAmount = movements
    .filter(m => m.type === 'expense' || m.type === 'withdrawal')
    .reduce((sum, m) => sum + Math.abs(m.amount), 0)

  const movementTypeLabel: Record<string, string> = {
    sale: 'Venta',
    expense: 'Gasto',
    deposit: 'Ingreso',
    withdrawal: 'Retiro',
    opening: 'Apertura',
    closing: 'Cierre',
  }

  const movementTypeColor: Record<string, string> = {
    sale: 'text-green-600 dark:text-green-400',
    deposit: 'text-blue-600 dark:text-blue-400',
    expense: 'text-red-600 dark:text-red-400',
    withdrawal: 'text-orange-600 dark:text-orange-400',
    opening: 'text-slate-600 dark:text-slate-400',
    closing: 'text-slate-600 dark:text-slate-400',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Cargando...
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Caja</h1>
          <p className="text-sm text-muted-foreground">
            {session ? `Sesión abierta · ${selectedBranch?.name}` : 'No hay caja abierta'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/${orgSlug}/caja/historial`}>
            <Button variant="outline" size="sm" className="gap-2">
              <History className="h-4 w-4" />
              Historial
            </Button>
          </Link>
          {session ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setMovementDialog(true)}
              >
                <Plus className="h-4 w-4" />
                Movimiento
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  setClosingAmount(getExpectedAmount().toFixed(2))
                  setCloseDialog(true)
                }}
              >
                Cerrar caja
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Abrir caja
            </Button>
          )}
        </div>
      </div>

      {/* Status cards */}
      {session ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                  <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Monto inicial</p>
                  <p className="text-lg font-bold">{formatARS(session.opening_amount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ventas</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {formatARS(salesAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-950">
                  <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gastos / Retiros</p>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {formatARS(expensesAmount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo esperado</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {formatARS(getExpectedAmount())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="py-16 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay caja abierta</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Abrí la caja para comenzar a registrar ventas y movimientos de dinero.
            </p>
            <Button
              onClick={() => setOpenDialog(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Abrir caja ahora
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Session info + movements */}
      {session && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Session info */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Información de sesión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Apertura:</span>
                <span className="font-medium">
                  {format(new Date(session.opened_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sucursal</span>
                <span className="font-medium">{selectedBranch?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Movimientos</span>
                <Badge variant="secondary">{movements.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Movements list */}
          <Card className="md:col-span-2 border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Últimos movimientos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Sin movimientos aún
                        </TableCell>
                      </TableRow>
                    ) : (
                      movements.map(mov => (
                        <TableRow key={mov.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(mov.created_at), 'HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {movementTypeLabel[mov.type] ?? mov.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                            {mov.description ?? '—'}
                          </TableCell>
                          <TableCell className={`text-right font-semibold text-sm ${movementTypeColor[mov.type] ?? ''}`}>
                            {mov.amount >= 0
                              ? <span className="flex items-center justify-end gap-1"><ArrowUpRight className="h-3 w-3" />{formatARS(mov.amount)}</span>
                              : <span className="flex items-center justify-end gap-1"><ArrowDownRight className="h-3 w-3" />{formatARS(Math.abs(mov.amount))}</span>
                            }
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Open Session Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Abrir caja</DialogTitle>
            <DialogDescription>
              Ingresá el monto inicial en efectivo disponible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="opening-amount" className="mb-2 block">
                Monto inicial en caja
              </Label>
              <Input
                id="opening-amount"
                type="number"
                placeholder="0.00"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                className="rounded-xl h-11 text-lg"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="session-notes" className="mb-2 block">Notas (opcional)</Label>
              <Textarea
                id="session-notes"
                placeholder="Observaciones de apertura..."
                value={sessionNotes}
                onChange={e => setSessionNotes(e.target.value)}
                className="rounded-xl"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setOpenDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                onClick={handleOpenSession}
                disabled={submitting}
              >
                {submitting ? 'Abriendo...' : 'Abrir caja'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Session Dialog */}
      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Cerrar caja</DialogTitle>
            <DialogDescription>
              Confirmá el monto real contado en caja.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/50 text-sm">
              <div>
                <p className="text-muted-foreground">Monto inicial</p>
                <p className="font-semibold">{session ? formatARS(session.opening_amount) : '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Ventas</p>
                <p className="font-semibold text-green-600">{formatARS(salesAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gastos / Retiros</p>
                <p className="font-semibold text-red-600">{formatARS(expensesAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Esperado en caja</p>
                <p className="font-bold text-blue-600">{formatARS(getExpectedAmount())}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="closing-amount" className="mb-2 block">
                Monto real contado
              </Label>
              <Input
                id="closing-amount"
                type="number"
                value={closingAmount}
                onChange={e => setClosingAmount(e.target.value)}
                className="rounded-xl h-11 text-lg"
                autoFocus
              />
            </div>

            {closingAmount && (
              <div className={`p-3 rounded-xl text-sm ${
                parseFloat(closingAmount) >= getExpectedAmount()
                  ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
              }`}>
                Diferencia: {formatARS(parseFloat(closingAmount) - getExpectedAmount())}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setCloseDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={handleCloseSession}
                disabled={submitting}
              >
                {submitting ? 'Cerrando...' : 'Cerrar caja'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={movementDialog} onOpenChange={setMovementDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Tipo</Label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'deposit', label: 'Ingreso', color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400' },
                  { value: 'withdrawal', label: 'Retiro', color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400' },
                  { value: 'expense', label: 'Gasto', color: 'border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMovementType(opt.value)}
                    className={`p-2 rounded-xl border-2 text-sm font-medium transition-all ${
                      movementType === opt.value
                        ? opt.color
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="mov-amount" className="mb-2 block">Monto</Label>
              <Input
                id="mov-amount"
                type="number"
                placeholder="0.00"
                value={movementAmount}
                onChange={e => setMovementAmount(e.target.value)}
                className="rounded-xl h-11 text-lg"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="mov-desc" className="mb-2 block">Descripción (opcional)</Label>
              <Input
                id="mov-desc"
                placeholder="Ej: Compra de insumos..."
                value={movementDescription}
                onChange={e => setMovementDescription(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setMovementDialog(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 rounded-xl"
                onClick={handleAddMovement}
                disabled={submitting || !movementAmount}
              >
                {submitting ? 'Guardando...' : 'Registrar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
