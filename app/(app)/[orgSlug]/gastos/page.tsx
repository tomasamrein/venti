'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Receipt, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatARS } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'
import { useOrg } from '@/hooks/use-org'

const EXPENSE_CATEGORIES = [
  'Servicios', 'Alquiler', 'Insumos', 'Mantenimiento',
  'Personal', 'Impuestos', 'Transporte', 'Marketing', 'Otro',
]

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  created_at: string
}

interface FormState {
  category: string; description: string; amount: string
}

export default function GastosPage() {
  const { org, branch, userId } = useOrg()
  const orgId = org.id
  const branchId = branch.id

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>({ category: 'Otro', description: '', amount: '' })

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function loadExpenses() {
    const supabase = createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('organization_id', orgId)
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
    setExpenses(data ?? [])
  }

  useEffect(() => {
    loadExpenses().then(() => setFetching(false))
  }, [orgId])  // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(form.amount)
    if (!form.description.trim()) { toast.error('La descripción es obligatoria'); return }
    if (!amt || amt <= 0) { toast.error('Ingresá un monto válido'); return }
    if (!branchId) { toast.error('No hay sucursal activa'); return }
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.from('expenses').insert({
      organization_id: orgId,
      branch_id: branchId,
      category: form.category,
      description: form.description.trim(),
      amount: amt,
      created_by: userId,
    })

    if (error) { toast.error('Error al guardar el gasto'); setLoading(false); return }

    toast.success('Gasto registrado')
    setForm({ category: 'Otro', description: '', amount: '' })
    setShowForm(false)
    setLoading(false)
    loadExpenses()
  }

  const totalHoy = expenses.reduce((s, e) => s + e.amount, 0)

  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    acc[e.category] = [...(acc[e.category] ?? []), e]
    return acc
  }, {})

  if (fetching) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className="h-8 w-48 rounded-lg bg-white/[0.05] animate-pulse" />
        <div className="rounded-xl border border-white/[0.07] bg-card h-64 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Gastos</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Total hoy: {formatARS(totalHoy)}</p>
        </div>
        <Button
          className="gap-2 rounded-xl text-white text-[13px]"
          style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancelar' : 'Nuevo gasto'}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
          <div className="p-5 space-y-4">
            <p className="text-[14px] font-semibold">Registrar gasto</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Categoría</Label>
                <select
                  value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-foreground focus:outline-none focus:border-violet-500/50"
                >
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Monto *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">$</span>
                  <Input
                    type="number" min="0" step="0.01"
                    value={form.amount} onChange={e => set('amount', e.target.value)}
                    placeholder="0.00"
                    className="h-10 pl-6 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Descripción *</Label>
              <Textarea
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="¿En qué se gastó?" rows={2}
                className="bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px] resize-none"
              />
            </div>
          </div>
          <div className="px-5 py-3.5 border-t border-white/[0.05] flex justify-end">
            <Button type="submit" disabled={loading} className="rounded-xl text-white text-[13px]"
              style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar gasto
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-[14px] font-semibold">Gastos del día</h2>
        </div>
        {!expenses.length ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[14px] text-muted-foreground">No hay gastos registrados hoy</p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-5 py-2 bg-white/[0.015] flex items-center justify-between">
                  <Badge variant="outline" className="text-[11px] border-white/10 text-muted-foreground">{cat}</Badge>
                  <span className="text-[12px] text-muted-foreground">
                    {formatARS(items.reduce((s, i) => s + i.amount, 0))}
                  </span>
                </div>
                {items.map(expense => (
                  <div key={expense.id} className="px-5 py-3 flex items-center justify-between border-t border-white/[0.03]">
                    <div>
                      <p className="text-[13px]">{expense.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(expense.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-red-400">{formatARS(expense.amount)}</p>
                  </div>
                ))}
              </div>
            ))}
            <div className="px-5 py-4 border-t border-white/[0.05] flex items-center justify-between">
              <p className="text-[13px] font-semibold">Total gastos del día</p>
              <p className="text-[16px] font-extrabold text-red-400">{formatARS(totalHoy)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
