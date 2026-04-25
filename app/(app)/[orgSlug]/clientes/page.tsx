import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus, Search, User, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatARS } from '@/lib/utils/currency'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ q?: string; account?: string }>
}

export default async function ClientesPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { q, account } = await searchParams
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  let query = supabase
    .from('customers')
    .select('*, current_accounts(balance, credit_limit)')
    .eq('organization_id', org.id)
    .eq('is_active', true)
    .order('full_name')

  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,dni.ilike.%${q}%,cuit.ilike.%${q}%`)
  if (account === '1') query = query.eq('has_account', true)

  const { data: customers } = await query

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Clientes</h1>
          <p className="text-[14px] text-muted-foreground mt-1">{customers?.length ?? 0} registros</p>
        </div>
        <Link
          href={`/${orgSlug}/clientes/nuevo`}
          className="inline-flex items-center gap-2 rounded-xl text-white text-[13px] font-semibold h-9 px-4 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <form className="flex-1 min-w-[200px] max-w-sm relative" method="GET">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre, teléfono, DNI..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-white/[0.08] text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50"
          />
          {account && <input type="hidden" name="account" value="1" />}
        </form>
        <div className="flex gap-2">
          <Link href={`/${orgSlug}/clientes${q ? `?q=${q}` : ''}`}>
            <Button variant={!account ? 'secondary' : 'ghost'} size="sm" className="rounded-lg text-[13px]">Todos</Button>
          </Link>
          <Link href={`/${orgSlug}/clientes?account=1${q ? `&q=${q}` : ''}`}>
            <Button variant={account === '1' ? 'secondary' : 'ghost'} size="sm" className="rounded-lg text-[13px]">Con cuenta corriente</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Cliente</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden sm:table-cell">Teléfono</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">DNI / CUIT</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Cuenta corriente</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {!customers?.length && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-[14px] text-muted-foreground">
                  No hay clientes{q ? ` para "${q}"` : ''}
                </td>
              </tr>
            )}
            {customers?.map(c => {
              const account = Array.isArray(c.current_accounts) ? c.current_accounts[0] : null
              const balance = account?.balance ?? null
              return (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium">{c.full_name}</p>
                        {c.alias && <p className="text-[11px] text-muted-foreground">{c.alias}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    {c.phone
                      ? <div className="flex items-center gap-1.5 text-[13px]"><Phone className="h-3 w-3 text-muted-foreground" />{c.phone}</div>
                      : <span className="text-muted-foreground text-[13px]">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-[13px] text-muted-foreground">
                    {c.dni || c.cuit || '—'}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    {balance !== null ? (
                      <span className={`text-[13px] font-semibold ${balance < 0 ? 'text-red-400' : balance > 0 ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                        {formatARS(balance)}
                      </span>
                    ) : (
                      <Badge variant="outline" className="text-[11px] border-white/[0.08] text-muted-foreground">Sin cuenta</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/${orgSlug}/clientes/${c.id}`} className="h-7 px-3 text-[12px] rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 inline-flex items-center transition-colors">
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
