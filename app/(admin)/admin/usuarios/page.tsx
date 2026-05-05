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
          <h1 className="text-[22px] font-bold tracking-tight text-foreground">Usuarios</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">{profiles?.length ?? 0} resultados</p>
        </div>
      </div>

      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 h-9 px-3 rounded-lg bg-muted border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-300"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-lg text-[13px] font-semibold text-foreground"
          style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}
        >
          Buscar
        </button>
      </form>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Usuario</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Teléfono</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Registrado</th>
            </tr>
          </thead>
          <tbody>
            {profiles?.map(p => (
              <tr key={p.id} className="border-b border-border hover:bg-muted/40 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-muted/40 flex items-center justify-center shrink-0">
                      <span className="text-[11px] font-bold text-foreground">
                        {(p.full_name?.[0] ?? '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{p.full_name ?? 'Sin nombre'}</p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate max-w-[160px]">{p.id.slice(0, 8)}…</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-[13px] text-muted-foreground">{p.phone ?? '—'}</td>
                <td className="px-5 py-3">
                  {p.is_super_admin ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700">
                      Super Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted/50 text-muted-foreground">
                      Usuario
                    </span>
                  )}
                </td>
                <td className="px-5 py-3 text-[13px] text-muted-foreground">
                  {new Date(p.created_at).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
            {!profiles?.length && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-muted-foreground">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
