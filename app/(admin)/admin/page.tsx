import { createClient } from '@/lib/supabase/server'
import { Building2, Users, CreditCard, TrendingUp } from 'lucide-react'

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
    { label: 'Organizaciones', value: totalOrgs ?? 0, sub: `${activeOrgs ?? 0} activas`, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Suscripciones activas', value: activeSubs.length, sub: `${trialCount} en trial`, icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'MRR estimado', value: formatARS(mrr), sub: `${pastDueCount} vencidas`, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Usuarios totales', value: totalUsers ?? 0, sub: 'en todas las orgs', icon: Users, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ]

  const { data: recentOrgs } = await supabase
    .from('organizations')
    .select('id, name, slug, is_active, created_at, trial_ends_at')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-[13px] text-[#5a6480] mt-0.5">Resumen global del sistema</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 space-y-3">
              <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center`}>
                <Icon className={`h-4.5 w-4.5 ${s.color}`} />
              </div>
              <div>
                <p className="text-[22px] font-bold text-white tracking-tight">{s.value}</p>
                <p className="text-[12px] text-[#5a6480] mt-0.5">{s.label}</p>
                <p className="text-[11px] text-[#3d4560] mt-0.5">{s.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-[14px] font-semibold text-white">Organizaciones recientes</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Nombre</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Slug</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Estado</th>
              <th className="text-left px-5 py-3 text-[11px] font-medium text-[#5a6480] uppercase tracking-wider">Creada</th>
            </tr>
          </thead>
          <tbody>
            {recentOrgs?.map(org => (
              <tr key={org.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3 text-[13px] text-white font-medium">{org.name}</td>
                <td className="px-5 py-3 text-[13px] text-[#5a6480] font-mono">{org.slug}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${org.is_active ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                    {org.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[13px] text-[#5a6480]">
                  {new Date(org.created_at).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
            {!recentOrgs?.length && (
              <tr><td colSpan={4} className="px-5 py-8 text-center text-[13px] text-[#5a6480]">Sin organizaciones aún</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
