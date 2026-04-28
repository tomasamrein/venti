'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Plus, Minus } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { formatARS } from '@/lib/utils/currency'
import { useOrg } from '@/hooks/use-org'

interface Transaction {
  id: string
  type: string
  amount: number
  balance_after: number
  description: string | null
  created_at: string
  sale_id: string | null
}

interface Account {
  id: string
  balance: number
  credit_limit: number | null
  notes: string | null
  customers: { full_name: string; phone: string | null; alias: string | null }
}

export default function CuentaCorrientePage() {
  const router = useRouter()
  const params = useParams()
  const accountId = params.id as string
  const { org, userId } = useOrg()
  const orgSlug = org.slug
  const orgId = org.id

  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState<'charge' | 'payment' | null>(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  async function loadData() {
    const supabase = createClient()

    const { data: acc } = await supabase
      .from('current_accounts')
      .select('*, customers(full_name, phone, alias)')
      .eq('id', accountId)
      .single()
    if (!acc) { toast.error('Cuenta no encontrada'); router.replace(`/${orgSlug}/cuentas-corrientes`); return }
    setAccount(acc as unknown as Account)

    const { data: txs } = await supabase
      .from('current_account_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(50)
    setTransactions(txs ?? [])
    setFetching(false)
  }

  useEffect(() => { loadData() }, [accountId])  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTransaction(type: 'charge' | 'payment') {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) { toast.error('Ingresá un monto válido'); return }
    setLoading(true)
    const supabase = createClient()

    const currentBalance = account?.balance ?? 0
    const signedAmount = type === 'charge' ? -amt : amt
    const newBalance = currentBalance + signedAmount

    const { error } = await supabase.from('current_account_transactions').insert({
      account_id: accountId,
      organization_id: orgId,
      type,
      amount: signedAmount,
      balance_after: newBalance,
      description: description || (type === 'charge' ? 'Cargo manual' : 'Pago recibido'),
      created_by: userId,
    })

    if (error) { toast.error('Error al registrar'); setLoading(false); return }

    toast.success(type === 'charge' ? 'Cargo registrado' : 'Pago registrado')
    setAmount('')
    setDescription('')
    setShowForm(null)
    setLoading(false)
    loadData()
  }

  const customer = account?.customers as unknown as { full_name: string; phone: string | null; alias: string | null }

  if (fetching) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 w-48 rounded-lg bg-white/[0.05] animate-pulse mb-4" />
        <div className="rounded-xl border border-white/[0.07] bg-card h-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/cuentas-corrientes`} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">{customer?.full_name}</h1>
          <p className="text-[13px] text-muted-foreground">
            {customer?.alias && `${customer.alias} · `}
            {customer?.phone || 'Sin teléfono'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow p-6">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Saldo actual</p>
            <p className={`text-[36px] font-extrabold tracking-[-0.04em] ${(account?.balance ?? 0) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {formatARS(account?.balance ?? 0)}
            </p>
            {account?.credit_limit && (
              <p className="text-[12px] text-muted-foreground mt-1">
                Límite de crédito: {formatARS(account.credit_limit)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost" size="sm"
              className="h-8 px-3 rounded-lg text-[12px] text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5"
              onClick={() => setShowForm(showForm === 'charge' ? null : 'charge')}
            >
              <Plus className="h-3.5 w-3.5" />Cargo
            </Button>
            <Button
              variant="ghost" size="sm"
              className="h-8 px-3 rounded-lg text-[12px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1.5"
              onClick={() => setShowForm(showForm === 'payment' ? null : 'payment')}
            >
              <Minus className="h-3.5 w-3.5" />Pago
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
            <p className="text-[13px] font-semibold text-foreground">
              {showForm === 'charge' ? 'Registrar cargo' : 'Registrar pago'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monto *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">$</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-10 pl-6 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Descripción</Label>
                <Input
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder={showForm === 'charge' ? 'Motivo del cargo' : 'Motivo del pago'}
                  className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" className="rounded-lg text-[13px]" onClick={() => setShowForm(null)}>Cancelar</Button>
              <Button
                size="sm"
                disabled={loading}
                className={`rounded-lg text-[13px] text-white ${showForm === 'charge' ? 'bg-red-500/80 hover:bg-red-500' : 'bg-emerald-600/80 hover:bg-emerald-600'}`}
                onClick={() => handleTransaction(showForm)}
              >
                {loading && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-[14px] font-semibold">Movimientos</h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {!transactions.length && (
            <p className="text-center py-10 text-[14px] text-muted-foreground">Sin movimientos registrados</p>
          )}
          {transactions.map(tx => (
            <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  {tx.amount > 0
                    ? <Minus className="h-3.5 w-3.5 text-emerald-400" />
                    : <Plus className="h-3.5 w-3.5 text-red-400" />}
                </div>
                <div>
                  <p className="text-[13px] font-medium">{tx.description}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {tx.sale_id && <span className="ml-2"><Badge variant="outline" className="text-[10px] border-white/10">Venta</Badge></span>}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-[14px] font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{formatARS(tx.amount)}
                </p>
                <p className="text-[11px] text-muted-foreground">Saldo: {formatARS(tx.balance_after)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
