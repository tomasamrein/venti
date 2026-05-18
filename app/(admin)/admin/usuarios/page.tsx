import { createClient } from '@/lib/supabase/server'
import { CreateAccountButton } from './create-account-button'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, full_name, is_super_admin, created_at, phone')
    .order('created_at', { ascending: false })
    .limit(100)

  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data: profiles } = await query

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Usuarios</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">{profiles?.length ?? 0} resultados</p>
        </div>
        <CreateAccountButton />
      </div>

      <form method="GET" className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 h-9 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/50"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors"
        >
          Buscar
        </button>
      </form>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Teléfono</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map(p => (
              <tr key={p.id} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-zinc-300">
                        {(p.full_name?.[0] ?? '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-zinc-100">{p.full_name ?? 'Sin nombre'}</p>
                      <p className="text-[11px] text-zinc-600 font-mono truncate max-w-[140px]">{p.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-500">{p.phone ?? '—'}</td>
                <td className="px-5 py-3">
                  {p.is_super_admin ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                      Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-700/30 text-zinc-500 border border-zinc-700/30">
                      Usuario
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-500">
                  {new Date(p.created_at).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
            {!profiles?.length && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-zinc-600">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
