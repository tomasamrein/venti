'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Receipt, X, ChevronLeft, ChevronRight } from 'lucide-react'
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

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function monthEnd(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

export default function GastosPage() {
  const { org, branch, userId } = useOrg()
  const orgId = org.id
  const branchId = branch.id

  const [currentMonth, setCurrentMonth] = useState(() => monthStart(new Date()))
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>({ category: 'Otro', description: '', amount: '' })

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm(f => ({ ...f, [k]: v }))
  }

  const isCurrentMonth = currentMonth.getMonth() === new Date().getMonth() &&
    currentMonth.getFullYear() === new Date().getFullYear()

  async function loadExpenses(month: Date) {
    setFetching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('expenses')
      .select('*')
      .eq('organization_id', orgId)
      .gte('created_at', monthStart(month).toISOString())
      .lte('created_at', monthEnd(month).toISOString())
      .order('created_at', { ascending: false })
    setExpenses(data ?? [])
    setFetching(false)
  }

  useEffect(() => {
    loadExpenses(currentMonth)
  }, [orgId, currentMonth])  // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))
  }
  function nextMonth() {
    if (!isCurrentMonth) setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))
  }

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
    loadExpenses(currentMonth)
  }

  const totalMes = expenses.reduce((s, e) => s + e.amount, 0)

  const grouped = expenses.reduce<Record<string, Expense[]>>((acc, e) => {
    acc[e.category] = [...(acc[e.category] ?? []), e]
    return acc
  }, {})

  const monthLabel = currentMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Gastos</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Total del mes: {formatARS(totalMes)}</p>
        </div>
        {isCurrentMonth && (
          <Button
            className="gap-2 rounded-xl text-white text-[13px]"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? 'Cancelar' : 'Nuevo gasto'}
          </Button>
        )}
      </div>

      {showForm && isCurrentMonth && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="p-5 space-y-4">
            <p className="text-[14px] font-semibold">Registrar gasto</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Categoría</Label>
                <select
                  value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-muted/30 border border-border text-[14px] text-foreground focus:outline-none focus:border-emerald-300/50"
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
                    className="h-10 pl-6 bg-muted/30 border-border rounded-xl text-[14px]"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Descripción *</Label>
              <Textarea
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="¿En qué se gastó?" rows={2}
                className="bg-muted/30 border-border rounded-xl text-[14px] resize-none"
              />
            </div>
          </div>
          <div className="px-5 py-3.5 border-t border-border flex justify-end">
            <Button type="submit" disabled={loading} className="rounded-xl text-white text-[13px]"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar gasto
            </Button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-[14px] font-semibold capitalize">{monthLabel}</h2>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={nextMonth} disabled={isCurrentMonth} className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {fetching ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !expenses.length ? (
          <div className="py-14 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
              <Receipt className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[14px] text-muted-foreground">No hay gastos registrados en {monthLabel}</p>
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <div className="px-5 py-2 bg-muted/20 flex items-center justify-between">
                  <Badge variant="outline" className="text-[11px] border-border text-muted-foreground">{cat}</Badge>
                  <span className="text-[12px] text-muted-foreground">
                    {formatARS(items.reduce((s, i) => s + i.amount, 0))}
                  </span>
                </div>
                {items.map(expense => (
                  <div key={expense.id} className="px-5 py-3 flex items-center justify-between border-t border-border">
                    <div>
                      <p className="text-[13px]">{expense.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(expense.created_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                          timeZone: 'America/Argentina/Buenos_Aires',
                        })}
                      </p>
                    </div>
                    <p className="text-[14px] font-semibold text-red-400">{formatARS(expense.amount)}</p>
                  </div>
                ))}
              </div>
            ))}
            <div className="px-5 py-4 border-t border-border flex items-center justify-between">
              <p className="text-[13px] font-semibold">Total del mes</p>
              <p className="text-[16px] font-extrabold text-red-400">{formatARS(totalMes)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
