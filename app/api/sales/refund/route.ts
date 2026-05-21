import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { saleId, reason, creditToAccount } = await req.json()
  if (!saleId) return NextResponse.json({ error: 'saleId required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: sale, error: saleErr } = await admin
    .from('sales')
    .select('*, sale_items(*)')
    .eq('id', saleId)
    .single()

  if (saleErr || !sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  if (sale.status !== 'completed') return NextResponse.json({ error: 'Solo se pueden reembolsar ventas completadas' }, { status: 400 })

  const { error: updateErr } = await admin
    .from('sales')
    .update({ status: 'refunded', notes: sale.notes ? `${sale.notes} | Reembolso: ${reason}` : `Reembolso: ${reason}` })
    .eq('id', saleId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  const items = Array.isArray(sale.sale_items) ? sale.sale_items : []
  for (const item of items) {
    if (item.product_id) {
      await admin.rpc('increment_stock', { product_id: item.product_id, qty: item.quantity }).maybeSingle()
        .catch(() => admin
          .from('products')
          .select('stock_current')
          .eq('id', item.product_id)
          .single()
          .then(({ data }) => data
            ? admin.from('products').update({ stock_current: (data.stock_current ?? 0) + item.quantity }).eq('id', item.product_id)
            : null
          )
        )
    }
  }

  if (creditToAccount && sale.customer_id) {
    const { data: account } = await admin
      .from('current_accounts')
      .select('id, balance')
      .eq('organization_id', sale.organization_id)
      .eq('customer_id', sale.customer_id)
      .maybeSingle()

    if (account) {
      await admin.from('current_account_transactions').insert({
        account_id: account.id,
        organization_id: sale.organization_id,
        type: 'adjustment',
        amount: sale.total,
        balance_after: account.balance + sale.total,
        description: `Devolución venta #${sale.sale_number ?? saleId.slice(0, 8)}`,
        sale_id: saleId,
        created_by: user.id,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
