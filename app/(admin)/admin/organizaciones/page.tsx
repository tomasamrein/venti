import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Building2, ChevronRight } from 'lucide-react'

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>
}

export default async function AdminOrgsPage({ searchParams }: Props) {
  const { q, status } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('organizations')
    .select('id, name, slug, is_active, created_at, trial_ends_at, email, phone')
    .order('created_at', { ascending: false })

  if (q) query = query.ilike('name', `%${q}%`)
  if (status === 'active') query = query.eq('is_active', true)
  if (status === 'inactive') query = query.eq('is_active', false)

  const { data: orgs } = await query.limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Organizaciones</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{orgs?.length ?? 0} resultados</p>
        </div>
      </div>

      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 h-9 px-3 rounded-lg bg-muted/30 border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-300"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="h-9 px-3 rounded-lg bg-muted/30 border border-border text-[13px] text-foreground focus:outline-none focus:border-emerald-300"
        >
          <option value="">Todos</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <button
          type="submit"
          className="h-9 px-4 rounded-lg text-[13px] font-semibold text-foreground"
          style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}
        >
          Filtrar
        </button>
      </form>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Organización</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Contacto</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Creada</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs?.map(org => (
              <tr key={org.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{org.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{org.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-[13px] text-muted-foreground">{org.email ?? '—'}</p>
                  <p className="text-[11px] text-muted-foreground">{org.phone ?? ''}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${org.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {org.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[13px] text-muted-foreground">
                  {new Date(org.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/organizaciones/${org.id}`}
                    className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Ver <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {!orgs?.length && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-muted-foreground">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
