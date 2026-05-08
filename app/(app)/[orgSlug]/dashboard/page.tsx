import { createClient } from '@/lib/supabase/server'
import { getOrgBySlug } from '@/lib/supabase/get-org'
import { toZonedTime } from 'date-fns-tz'
import { OnboardingBanner } from '@/components/dashboard/onboarding-banner'
import { DashboardClient } from '@/components/dashboard/dashboard-client'

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
  const isPro = planType === 'pro'

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

  const nowUtc = new Date()
  const nowAR = toZonedTime(nowUtc, TZ)
  const dateLabel = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ,
  }).format(nowUtc)

  // These counts are static (not period-dependent) — fetch once server-side for onboarding banner
  const [{ count: totalProducts }, { count: totalSales }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
    supabase.from('sales').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('status', 'completed'),
  ])

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold text-foreground">Buen día</h1>
        <p className="text-sm text-muted-foreground">
          {org.name} — <span className="capitalize">{dateLabel}</span>
        </p>
      </div>

      <OnboardingBanner
        orgSlug={orgSlug}
        hasProducts={(totalProducts ?? 0) > 0}
        hasSales={(totalSales ?? 0) > 0}
        hasCashSession={false}
      />

      <DashboardClient
        orgSlug={orgSlug}
        isPro={isPro}
        branches={branches}
        defaultPeriod={period}
        defaultBranchId={defaultBranchId}
      />
    </div>
  )
}
