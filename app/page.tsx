import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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
}
