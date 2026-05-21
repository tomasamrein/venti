import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { isBusinessTier } from '@/lib/utils/plan'
import { ProGate } from '@/components/shared/pro-gate'
import { StockOrdersClient } from '@/components/compras/stock-orders-client'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function OrdenesCompraPage({ params }: Props) {
  const { orgSlug } = await params
  const supabase = await createClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('id, trial_ends_at')
    .eq('slug', orgSlug)
    .single()
  if (!org) notFound()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan:subscription_plans(type)')
    .eq('organization_id', org.id)
    .maybeSingle()

  const planType = (subscription?.plan as { type?: string } | null)?.type ?? 'free_trial'

  if (!isBusinessTier(planType)) {
    return (
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Órdenes de compra</h1>
        <ProGate planType={planType} orgSlug={orgSlug}>
          <></>
        </ProGate>
      </div>
    )
  }

  const { data: orders } = await (supabase as any)
    .from('stock_orders')
    .select('id, supplier_name, status, total_cost, ordered_at, received_at, notes, stock_order_items(product_name, quantity, unit_cost, subtotal)')
    .eq('organization_id', org.id)
    .order('ordered_at', { ascending: false })
    .limit(50)

  return <StockOrdersClient orders={(orders ?? []) as any[]} orgSlug={orgSlug} />
}
