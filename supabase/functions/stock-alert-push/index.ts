import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const appUrl = Deno.env.get('APP_URL') ?? 'https://app.venti.ar'
const internalSecret = Deno.env.get('INTERNAL_PUSH_SECRET')

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const { record } = await req.json() as {
    record: {
      id: string
      organization_id: string
      product_id: string
      alert_type: string
      current_stock: number
      threshold: number
    }
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data: product } = await supabase
    .from('products')
    .select('name')
    .eq('id', record.product_id)
    .single()

  const productName = product?.name ?? 'Producto desconocido'
  const isOut = record.alert_type === 'out_of_stock'
  const title = isOut ? 'Sin stock' : 'Stock bajo'
  const body = isOut
    ? `${productName} se agotó — agregalo a tu lista de compras`
    : `${productName} — quedan ${record.current_stock} unidades, es hora de reponer`

  // Insert in-app notifications for owners and admins
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', record.organization_id)
    .eq('is_active', true)
    .in('role', ['owner', 'admin'])

  if (members?.length) {
    await supabase.from('notifications').insert(
      members.map((m: { user_id: string }) => ({
        organization_id: record.organization_id,
        user_id: m.user_id,
        type: record.alert_type,
        title,
        body,
        data: { product_id: record.product_id, stock_alert_id: record.id },
        sent_at: new Date().toISOString(),
      }))
    )
  }

  // Send web push via Next.js /api/push/send
  if (internalSecret) {
    await fetch(`${appUrl}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${internalSecret}`,
      },
      body: JSON.stringify({
        organizationId: record.organization_id,
        title,
        body,
        data: { product_id: record.product_id, type: record.alert_type },
      }),
    }).catch(() => {})
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
