import { createClient } from '@/lib/supabase/server'
import { getOrgBySlug } from '@/lib/supabase/get-org'
import { notFound } from 'next/navigation'
import { Shield } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  params: Promise<{ orgSlug: string }>
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  insert: { label: 'Creación', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' },
  update: { label: 'Edición', color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
  delete: { label: 'Eliminación', color: 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' },
}

const TABLE_LABELS: Record<string, string> = {
  products: 'Producto',
  customers: 'Cliente',
}

export default async function AuditoriaPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()
  const org = await getOrgBySlug(orgSlug)
  if (!org) notFound()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, table_name, record_id, action, old_data, new_data, created_at, user_id')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const userIds = [...new Set((logs ?? []).map(l => l.user_id).filter(Boolean))]

  let profilesMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds as string[])
    profilesMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name ?? 'Usuario']))
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Shield className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">Auditoría</h1>
          <p className="text-[13px] text-muted-foreground">Últimos 100 cambios en productos y clientes</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {!logs?.length ? (
          <div className="py-16 text-center">
            <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-[14px] font-medium">Sin registros aún</p>
            <p className="text-[13px] text-muted-foreground mt-1">Los cambios en productos y clientes aparecerán aquí</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map(log => {
              const actionInfo = ACTION_LABELS[log.action] ?? { label: log.action, color: 'text-muted-foreground bg-muted border-border' }
              const tableLabel = TABLE_LABELS[log.table_name] ?? log.table_name
              const userName = log.user_id ? (profilesMap[log.user_id] ?? 'Usuario') : 'Sistema'
              const recordName = (log.new_data as Record<string, string> | null)?.name
                ?? (log.old_data as Record<string, string> | null)?.name
                ?? log.record_id.slice(0, 8)

              return (
                <div key={log.id} className="px-5 py-3.5 flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionInfo.color}`}>
                    {actionInfo.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium">
                      <span className="text-muted-foreground">{tableLabel}:</span> {recordName}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {userName} · {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
