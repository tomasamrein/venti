import { createClient } from '@/lib/supabase/server'
import { getOrgBySlug } from '@/lib/supabase/get-org'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Search, TrendingDown, TrendingUp, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatARS } from '@/lib/utils/currency'
import { EmptyState } from '@/components/shared/empty-state'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ q?: string }>
}

export default async function CuentasCorrientesPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { q } = await searchParams
  const [supabase, org] = await Promise.all([createClient(), getOrgBySlug(orgSlug)])
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
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-400" />
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Total adeudado</p>
          </div>
          <p className="text-[18px] sm:text-[22px] font-extrabold tracking-[-0.03em] text-red-400 truncate">{formatARS(Math.abs(totalDebt))}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Total a favor clientes</p>
          </div>
          <p className="text-[18px] sm:text-[22px] font-extrabold tracking-[-0.03em] text-emerald-400 truncate">{formatARS(totalCredit)}</p>
        </div>
      </div>

      <form className="max-w-sm relative" method="GET">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar cliente..."
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-300/50"
        />
      </form>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full min-w-[380px]">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Cliente</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Teléfono</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Saldo</th>
              <th className="text-right text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Límite</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!accounts?.length && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    variant="no-accounts"
                    title={q ? `Sin resultados para "${q}"` : 'Sin cuentas corrientes'}
                    description={q ? 'Probá con otro nombre o teléfono' : 'Las cuentas se crean desde el perfil de cada cliente'}
                  />
                </td>
              </tr>
            )}
            {accounts?.map(a => {
              const customer = Array.isArray(a.customers) ? a.customers[0] : a.customers as { full_name: string; phone: string | null; alias: string | null; id: string }
              return (
                <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600/10 flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4 text-emerald-600" />
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
                    <Link href={`/${orgSlug}/cuentas-corrientes/${a.id}`} className="h-7 px-3 text-[12px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center transition-colors">
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
