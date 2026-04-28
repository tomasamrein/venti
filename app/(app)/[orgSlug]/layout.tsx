import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { OfflineBanner } from '@/components/shared/offline-banner'
import { TrialBanner } from '@/components/shared/trial-banner'
import { OrgProvider } from '@/components/providers/org-provider'

interface Props {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, slug, timezone, currency, settings, is_active, trial_ends_at')
      .eq('slug', orgSlug)
      .single(),
    supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  if (!org) notFound()

  const { data: member } = await supabase
    .from('organization_members')
    .select('role, branch_id')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) redirect('/login')

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
    </OrgProvider>
  )
}
