import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/products/product-form'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function NuevoProductoPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) notFound()

  return <ProductForm orgSlug={orgSlug} orgId={org.id} />
}
