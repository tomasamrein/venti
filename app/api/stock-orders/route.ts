import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { organizationId, branchId, supplierId, supplierName, notes, items } = await req.json()
  if (!organizationId || !branchId || !items?.length) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const totalCost = items.reduce((s: number, i: { subtotal: number }) => s + i.subtotal, 0)

  const { data: order, error: orderErr } = await (supabase as any)
    .from('stock_orders')
    .insert({
      organization_id: organizationId,
      branch_id: branchId,
      supplier_id: supplierId || null,
      supplier_name: supplierName || null,
      notes: notes || null,
      total_cost: totalCost,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (orderErr || !order) return NextResponse.json({ error: orderErr?.message }, { status: 500 })

  const { error: itemsErr } = await (supabase as any).from('stock_order_items').insert(
    items.map((i: { productId?: string; productName: string; quantity: number; unitCost: number; subtotal: number }) => ({
      order_id: order.id,
      product_id: i.productId || null,
      product_name: i.productName,
      quantity: i.quantity,
      unit_cost: i.unitCost,
      subtotal: i.subtotal,
    }))
  )

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

  return NextResponse.json({ id: order.id })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId, status } = await req.json()
  if (!orderId || !status) return NextResponse.json({ error: 'orderId y status requeridos' }, { status: 400 })

  const update: Record<string, string> = { status }
  if (status === 'received') update.received_at = new Date().toISOString()

  const { error } = await (supabase as any).from('stock_orders').update(update).eq('id', orderId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
