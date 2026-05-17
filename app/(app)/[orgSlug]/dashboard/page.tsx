import { createClient } from '@/lib/supabase/server'
import { getOrgBySlug } from '@/lib/supabase/get-org'
import { WelcomeDialog } from '@/components/dashboard/welcome-dialog'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { SuppliersWidget } from '@/components/dashboard/suppliers-widget'
import { hasMultiBranch } from '@/lib/utils/plan'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ period?: string; branch?: string }>
}

const TZ = 'America/Argentina/Buenos_Aires'

export default async function DashboardPage({ params, searchParams }: Props) {
  const [{ orgSlug }, sp] = await Promise.all([params, searchParams])
  const period = sp.period === 'month' || sp.period === 'year' ? sp.period : 'day'

  const [supabase, org] = await Promise.all([createClient(), getOrgBySlug(orgSlug)])
  if (!org) return null

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: membership }, { data: subscription }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('role, branch_id')
      .eq('organization_id', org.id)
      .eq('user_id', user!.id)
      .single(),
    supabase
      .from('subscriptions')
      .select('subscription_plans(type)')
      .eq('organization_id', org.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle(),
  ])

  const planType = (subscription?.subscription_plans as any)?.type ?? 'free_trial'
  const isPro = hasMultiBranch(planType)

  let branches: { id: string; name: string }[] = []
  if (isPro) {
    const { data } = await supabase
      .from('branches')
      .select('id, name')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('is_main', { ascending: false })
    branches = data ?? []
  }

  const defaultBranchId = isPro
    ? (sp.branch && sp.branch !== 'all' ? sp.branch : null)
    : (membership?.branch_id ?? null)

  const orgSettings = (org.settings as Record<string, unknown> | null) ?? {}
  const showSuppliersPanel = org.business_type === 'almacen' || !!orgSettings.suppliers_panel

  const nowUtc = new Date()
  const dateLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ,
  }).format(nowUtc)

  return (
    <div className="space-y-6 max-w-6xl">
      <WelcomeDialog orgSlug={orgSlug} orgName={org.name} />

      <div className="space-y-0.5">
        <h1 className="text-xl font-bold text-foreground">Buen día</h1>
        <p className="text-sm text-muted-foreground">
          {org.name} — <span className="capitalize">{dateLabel}</span>
        </p>
      </div>

      <DashboardClient
        orgSlug={orgSlug}
        isPro={isPro}
        branches={branches}
        defaultPeriod={period}
        defaultBranchId={defaultBranchId}
      />

      {showSuppliersPanel && <SuppliersWidget orgId={org.id} orgSlug={orgSlug} />}
    </div>
  )
}
