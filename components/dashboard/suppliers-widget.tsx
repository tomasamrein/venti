import Link from 'next/link'
import { Building2, Plus, ArrowRight, Phone, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

interface Props {
  orgId: string
  orgSlug: string
}

export async function SuppliersWidget({ orgId, orgSlug }: Props) {
  const supabase = await createClient()

  const [{ count: totalActive }, { data: recent }] = await Promise.all([
    supabase
      .from('suppliers')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('is_active', true),
    supabase
      .from('suppliers')
      .select('id, name, category, phone, email, contact_name')
      .eq('organization_id', orgId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Proveedores</p>
            <p className="text-xs text-muted-foreground">{totalActive ?? 0} activos</p>
          </div>
        </div>
        <Link
          href={`/${orgSlug}/proveedores/nuevo`}
          className="inline-flex items-center gap-1 h-8 px-3 rounded-lg text-[12px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo
        </Link>
      </div>

      {!recent?.length ? (
        <div className="px-5 py-8 text-center">
          <p className="text-[13px] text-muted-foreground">Aún no cargaste proveedores</p>
          <Link
            href={`/${orgSlug}/proveedores/nuevo`}
            className="inline-flex items-center gap-1 mt-2 text-[12px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Cargar el primero <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-border">
            {recent.map(s => (
              <li key={s.id}>
                <Link
                  href={`/${orgSlug}/proveedores/${s.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {s.category ? `${s.category} · ` : ''}
                      {s.contact_name || s.email || s.phone || 'Sin contacto'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.phone && <Phone className="h-3 w-3 text-muted-foreground" />}
                    {s.email && <Mail className="h-3 w-3 text-muted-foreground" />}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={`/${orgSlug}/proveedores`}
            className="block px-5 py-3 border-t border-border text-center text-[12px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-muted/30 transition-colors"
          >
            Ver todos →
          </Link>
        </>
      )}
    </div>
  )
}
