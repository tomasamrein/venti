import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/products/product-form'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ barcode?: string }>
}

export default async function NuevoProductoPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { barcode } = await searchParams
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) notFound()

  return <ProductForm orgSlug={orgSlug} orgId={org.id} initialBarcode={barcode} />
}
