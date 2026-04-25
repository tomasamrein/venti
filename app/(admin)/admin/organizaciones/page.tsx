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
          <h1 className="text-[22px] font-bold tracking-tight text-white">Organizaciones</h1>
          <p className="text-[13px] text-[#5a6480] mt-0.5">{orgs?.length ?? 0} resultados</p>
        </div>
      </div>

      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre..."
          className="flex-1 h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white placeholder:text-[#5a6480] focus:outline-none focus:border-white/20"
        />
        <select
          name="status"
          defaultValue={status ?? ''}
          className="h-9 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[13px] text-white focus:outline-none focus:border-white/20"
        >
          <option value="">Todos</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <button
          type="submit"
          className="h-9 px-4 rounded-lg text-[13px] font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}
        >
          Filtrar
        </button>
      </form>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Organización</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Contacto</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Creada</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs?.map(org => (
              <tr key={org.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-[#5a6480]" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-white">{org.name}</p>
                      <p className="text-[11px] text-[#5a6480] font-mono">{org.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-[13px] text-[#8891a8]">{org.email ?? '—'}</p>
                  <p className="text-[11px] text-[#5a6480]">{org.phone ?? ''}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${org.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {org.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[13px] text-[#5a6480]">
                  {new Date(org.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/organizaciones/${org.id}`}
                    className="inline-flex items-center gap-1 text-[12px] text-[#5a6480] hover:text-white transition-colors"
                  >
                    Ver <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </td>
              </tr>
            ))}
            {!orgs?.length && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[#5a6480]">Sin resultados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
