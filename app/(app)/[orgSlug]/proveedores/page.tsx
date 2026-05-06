import { createClient } from '@/lib/supabase/server'
import { getOrgBySlug } from '@/lib/supabase/get-org'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus, Search, Building2, Phone, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ q?: string; inactive?: string }>
}

export default async function ProveedoresPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { q, inactive } = await searchParams
  const [supabase, org] = await Promise.all([createClient(), getOrgBySlug(orgSlug)])
  if (!org) notFound()

  let query = supabase
    .from('suppliers')
    .select('*')
    .eq('organization_id', org.id)
    .eq('is_active', inactive ? false : true)
    .order('name')

  if (q) query = query.or(`name.ilike.%${q}%,alias.ilike.%${q}%,contact_name.ilike.%${q}%,cuit.ilike.%${q}%`)

  const { data: suppliers } = await query

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Proveedores</h1>
          <p className="text-[14px] text-muted-foreground mt-1">{suppliers?.length ?? 0} registros</p>
        </div>
        <Link
          href={`/${orgSlug}/proveedores/nuevo`}
          className="inline-flex items-center gap-2 rounded-xl text-white text-[13px] font-semibold h-9 px-4 transition-opacity hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}
        >
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </Link>
      </div>

      <div className="flex gap-3 flex-wrap">
        <form className="flex-1 min-w-[200px] max-w-sm relative" method="GET">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar proveedor..."
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-emerald-300/50"
          />
          {inactive && <input type="hidden" name="inactive" value="1" />}
        </form>
        <div className="flex gap-2">
          <Link href={`/${orgSlug}/proveedores${q ? `?q=${q}` : ''}`}>
            <Button variant={!inactive ? 'secondary' : 'ghost'} size="sm" className="rounded-lg text-[13px]">Activos</Button>
          </Link>
          <Link href={`/${orgSlug}/proveedores?inactive=1${q ? `&q=${q}` : ''}`}>
            <Button variant={inactive ? 'secondary' : 'ghost'} size="sm" className="rounded-lg text-[13px]">Inactivos</Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3">Proveedor</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Categoría</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden md:table-cell">Contacto</th>
              <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Teléfono / Email</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!suppliers?.length && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-[14px] text-muted-foreground">
                  No hay proveedores{q ? ` para "${q}"` : ''}
                </td>
              </tr>
            )}
            {suppliers?.map(s => (
              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{s.name}</p>
                      {s.cuit && <p className="text-[11px] text-muted-foreground">CUIT {s.cuit}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  {s.category
                    ? <Badge variant="outline" className="text-[11px] border-border text-muted-foreground">{s.category}</Badge>
                    : <span className="text-muted-foreground text-[13px]">—</span>}
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell text-[13px] text-muted-foreground">
                  {s.contact_name || '—'}
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <div className="space-y-0.5">
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-[13px]">
                        <Phone className="h-3 w-3 text-muted-foreground" />{s.phone}
                      </div>
                    )}
                    {s.email && (
                      <div className="flex items-center gap-1.5 text-[13px]">
                        <Mail className="h-3 w-3 text-muted-foreground" />{s.email}
                      </div>
                    )}
                    {!s.phone && !s.email && <span className="text-muted-foreground text-[13px]">—</span>}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/${orgSlug}/proveedores/${s.id}`} className="h-7 px-3 text-[12px] rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 inline-flex items-center transition-colors">
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
