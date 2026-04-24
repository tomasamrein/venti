import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductForm } from '@/components/products/product-form'
import { PriceHistoryChart } from '@/components/products/price-history-chart'

interface Props {
  params: Promise<{ orgSlug: string; id: string }>
}

export default async function EditProductoPage({ params }: Props) {
  const { orgSlug, id } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) notFound()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('organization_id', org.id)
    .single()

  if (!product) notFound()

  const { data: priceHistory } = await supabase
    .from('price_history')
    .select('changed_at, price_sell_new, price_cost_new, change_pct')
    .eq('product_id', id)
    .order('changed_at', { ascending: true })
    .limit(50)

  return (
    <div className="space-y-6">
      <ProductForm orgSlug={orgSlug} orgId={org.id} product={product} />
      {priceHistory && priceHistory.length > 0 && (
        <PriceHistoryChart history={priceHistory} />
      )}
    </div>
  )
}
