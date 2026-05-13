import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getOrgBySlug } from '@/lib/supabase/get-org'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { OfflineBanner } from '@/components/shared/offline-banner'
import { TrialBanner } from '@/components/shared/trial-banner'
import { OrgProvider } from '@/components/providers/org-provider'
import { SupportChat } from '@/components/layout/support-chat'
import { RememberMeGuard } from '@/components/providers/remember-me-guard'

interface Props {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [org, { data: profile }] = await Promise.all([
    getOrgBySlug(orgSlug),
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  if (!org) notFound()

  const [{ data: member }, { data: subscription }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('role, branch_id')
      .eq('organization_id', org.id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('subscriptions')
      .select('status, plan:subscription_plans(type)')
      .eq('organization_id', org.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!member) redirect('/login')

  const h = await headers()
  const pathname = h.get('x-pathname') ?? ''
  const isOnSuscripcion = pathname.includes('/configuracion')

  const trialExpired = org.trial_ends_at ? new Date(org.trial_ends_at) < new Date() : false
  const subStatus = subscription?.status
  const isBlocked = !subStatus
    || (subStatus === 'trialing' && trialExpired)
    || subStatus === 'canceled'
    || subStatus === 'past_due'

  if (isBlocked && !isOnSuscripcion) {
    redirect(`/${orgSlug}/configuracion/suscripcion`)
  }

  const planType = (subscription?.plan as { type?: string } | null)?.type ?? 'free_trial'

  // Resolve branch: prefer the member's assigned branch, else the main branch
  const branchQuery = member.branch_id
    ? supabase.from('branches').select('id, name, is_main').eq('id', member.branch_id).single()
    : supabase.from('branches').select('id, name, is_main').eq('organization_id', org.id).eq('is_main', true).single()

  const { data: branch } = await branchQuery

  if (!branch) notFound()

  return (
    <OrgProvider
      value={{
        org,
        branch,
        role: member.role,
        userId: user.id,
        userFullName: profile?.full_name ?? null,
        planType,
      }}
    >
      <div className="flex h-screen overflow-hidden">
        <Sidebar orgSlug={orgSlug} className="hidden md:flex w-60 shrink-0" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopNav
            orgSlug={orgSlug}
            organizationId={org.id}
            userName={profile?.full_name ?? undefined}
            userAvatar={profile?.avatar_url ?? undefined}
          />
          <TrialBanner trialEndsAt={org.trial_ends_at} isActive={org.is_active} />
          <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 scrollbar-thin">
            {children}
          </main>
          <OfflineBanner />
        </div>
      </div>
      <SupportChat />
      <RememberMeGuard />
    </OrgProvider>
  )
}
