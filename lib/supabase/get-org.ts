import { cache } from 'react'
import { createClient } from './server'

export const getOrgBySlug = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organizations')
    .select('id, name, slug, timezone, currency, settings, is_active, trial_ends_at, business_type')
    .eq('slug', slug)
    .single()
  return data
})
