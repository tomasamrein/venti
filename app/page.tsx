import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingPage from './(landing)/page'
import LandingLayout from './(landing)/layout'

export { metadata } from './(landing)/page'

export default async function RootPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organizations(slug)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      const slug = (member?.organizations as { slug: string } | null)?.slug
      redirect(slug ? `/${slug}/dashboard` : '/registro')
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
  }

  return (
    <LandingLayout>
      <LandingPage />
    </LandingLayout>
  )
}
