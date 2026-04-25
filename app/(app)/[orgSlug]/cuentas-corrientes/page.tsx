import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Search, TrendingDown, TrendingUp, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatARS } from '@/lib/utils/currency'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function CuentasCorrientesPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { q } = await searchParams
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  let query = supabase
    .from('current_accounts')
    .select('*, customers!inner(id, full_name, phone, alias)')
    .eq('organization_id', org.id)
    .order('balance', { ascending: true })

  if (q) {
    query = query.or(`customers.full_name.ilike.%${q}%,customers.phone.ilike.%${q}%`, { referencedTable: 'customers' })
  }

  const { data: accounts } = await query

  const totalDebt = accounts?.reduce((s, a) => s + (a.balance < 0 ? a.balance : 0), 0) ?? 0
  const totalCredit = accounts?.reduce((s, a) => s + (a.balance > 0 ? a.balance : 0), 0) ?? 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Cuentas Corrientes</h1>
        <p className="text-[14px] text-muted-foreground mt-1">{accounts?.length ?? 0} cuentas activas</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.07] bg-card card-shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Total adeudado</p>
          </div>
          <p className="text-[22px] font-extrabold tracking-[-0.03em] text-red-400">{formatARS(Math.abs(totalDebt))}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-card card-shadow p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Total a favor clientes</p>
          </div>
          <p className="text-[22px] font-extrabold tracking-[-0.03em] text-emerald-400">{formatARS(totalCredit)}</p>
        </div>
      </div>

      <form className="max-w-sm relative" method="GET">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar cliente..."
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-white/[0.08] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50"
        />
      </form>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Cliente</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Teléfono</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Saldo</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Límite</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!accounts?.length && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-[14px] text-muted-foreground">
                  No hay cuentas corrientes{q ? ` para "${q}"` : ''}
                </td>
              </tr>
            )}
            {accounts?.map(a => {
              const customer = Array.isArray(a.customers) ? a.customers[0] : a.customers as { full_name: string; phone: string | null; alias: string | null; id: string }
              return (
                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">{customer?.full_name}</p>
                        {customer?.alias && <p className="text-[11px] text-muted-foreground">{customer.alias}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell text-[13px] text-muted-foreground">
                    {customer?.phone || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-[15px] font-bold ${a.balance < 0 ? 'text-red-400' : a.balance > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                      {formatARS(a.balance)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-right text-[13px] text-muted-foreground">
                    {a.credit_limit ? formatARS(a.credit_limit) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/${orgSlug}/cuentas-corrientes/${a.id}`} className="h-7 px-3 text-[12px] rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 inline-flex items-center transition-colors">
                      Ver
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
