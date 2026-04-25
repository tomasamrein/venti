import { createClient } from '@/lib/supabase/server'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-white">Usuarios</h1>
          <p className="text-[13px] text-[#5a6480] mt-0.5">{profiles?.length ?? 0} resultados</p>
        </div>
      </div>

      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-[#5a6480] focus:outline-none focus:border-white/20"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}
        >
          Buscar
        </button>
      </form>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Usuario</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Teléfono</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map(p => (
              <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-white">
                        {(p.full_name?.[0] ?? '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-white">{p.full_name ?? 'Sin nombre'}</p>
                      <p className="text-[11px] text-[#5a6480] font-mono truncate max-w-[160px]">{p.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-[13px] text-[#8891a8]">{p.phone ?? '—'}</td>
                <td className="px-5 py-3">
                  {p.is_super_admin ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/15 text-red-400">
                      Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.06] text-[#8891a8]">
                      Usuario
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-[13px] text-[#5a6480]">
                  {new Date(p.created_at).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
            {!profiles?.length && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-[#5a6480]">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
