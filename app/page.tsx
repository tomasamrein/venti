import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) redirect('/login')

    const { data: member } = await supabase
      .from('organization_members')
      .select('organizations(slug)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    const slug = (member?.organizations as { slug: string } | null)?.slug
    if (slug) redirect(`/${slug}/dashboard`)

    redirect('/registro')
  } catch (error) {
    // Re-throw redirect errors (Next.js uses thrown errors for redirects)
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error
    }
    // If Supabase connection fails, redirect to login
    redirect('/login')
  }
}
