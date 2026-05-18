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
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Organizaciones</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">{orgs?.length ?? 0} resultados</p>
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 h-9 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/50"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="h-9 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-[13px] text-zinc-100 focus:outline-none focus:border-zinc-600"
        >
          <option value="">Todos</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <button
          type="submit"
          className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
        >
          Filtrar
        </button>
      </form>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full min-w-[560px]">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Organización</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Contacto</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Creada</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs?.map(org => (
              <tr key={org.id} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-zinc-100">{org.name}</p>
                      <p className="text-[11px] text-zinc-500 font-mono">{org.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-[13px] text-zinc-400">{org.email ?? '—'}</p>
                  <p className="text-[11px] text-zinc-500">{org.phone ?? ''}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${org.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {org.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-500">
                  {new Date(org.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/organizaciones/${org.id}`}
                    className="inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    Ver <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {!orgs?.length && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-zinc-600">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
