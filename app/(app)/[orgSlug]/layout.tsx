import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { TopNav } from '@/components/layout/top-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ orgSlug: string }>
}

export default async function OrgLayout({ children, params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Resolve org and validate membership
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single()

  if (!org) notFound()

  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org.id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!member) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <Sidebar orgSlug={orgSlug} className="hidden md:flex w-60 shrink-0" />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav
          orgSlug={orgSlug}
          userName={profile?.full_name ?? undefined}
          userAvatar={profile?.avatar_url ?? undefined}
        />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
