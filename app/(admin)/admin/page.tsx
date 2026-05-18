import { createClient } from '@/lib/supabase/server'
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react'
import Link from 'next/link'

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalOrgs },
    { count: activeOrgs },
    { data: subs },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('subscriptions').select('status, subscription_plans(price_ars)'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
  ])

  const activeSubs = subs?.filter(s => s.status === 'active') ?? []
  const mrr = activeSubs.reduce((acc, s) => {
    const plan = s.subscription_plans as { price_ars: number } | null
    return acc + (plan?.price_ars ?? 0)
  }, 0)

  const trialCount = subs?.filter(s => s.status === 'trialing').length ?? 0
  const pastDueCount = subs?.filter(s => s.status === 'past_due').length ?? 0

  const stats = [
    { label: 'Organizaciones', value: totalOrgs ?? 0, sub: `${activeOrgs ?? 0} activas`, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    { label: 'Suscripciones activas', value: activeSubs.length, sub: `${trialCount} en trial`, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'MRR estimado', value: formatARS(mrr), sub: `${pastDueCount} vencidas`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Usuarios totales', value: totalUsers ?? 0, sub: 'en todas las orgs', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  ]

  const { data: recentOrgs } = await supabase
    .from('organizations')
    .select('id, name, slug, is_active, created_at, trial_ends_at')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Dashboard</h1>
        <p className="text-[13px] text-zinc-500 mt-0.5">Resumen global del sistema</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
              <div className={`w-8 h-8 rounded-lg border ${s.bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-zinc-100 tracking-tight leading-none">{s.value}</p>
                <p className="text-[11px] text-zinc-400 mt-1.5">{s.label}</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">{s.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <div className="px-5 py-4 border-b border-zinc-800">
          <h2 className="text-[14px] font-semibold text-zinc-100">Organizaciones recientes</h2>
        </div>
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Slug</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Creada</th>
            </tr>
          </thead>
          <tbody>
            {recentOrgs?.map(org => (
              <tr key={org.id} className="border-b border-zinc-800 hover:bg-zinc-800/40 transition-colors last:border-0">
                <td className="px-5 py-3">
                  <Link href={`/admin/organizaciones/${org.id}`} className="text-[13px] font-medium text-zinc-100 hover:text-red-400 transition-colors">
                    {org.name}
                  </Link>
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-500 font-mono">{org.slug}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${org.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {org.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[13px] text-zinc-500">
                  {new Date(org.created_at).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
            {!recentOrgs?.length && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-zinc-600">Sin organizaciones aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
