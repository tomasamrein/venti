import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const org_id = searchParams.get('org_id')
  if (!org_id) return NextResponse.json({ error: 'org_id requerido' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, barcode, sku, brand, unit, stock_current, stock_min, stock_max, price_cost, supplier_products(supplier_id, suppliers(name, phone, email))')
    .eq('organization_id', org_id)
    .eq('is_active', true)
    .eq('track_stock', true)
    .order('stock_current', { ascending: true })
    .limit(200)

  const suggestions = (allProducts || [])
    .filter(p => p.stock_current <= p.stock_min)
    .map(p => {
      const suggestedQty = p.stock_max
        ? Math.max(0, p.stock_max - p.stock_current)
        : Math.max(1, p.stock_min * 2 - p.stock_current)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const spList = (p as any).supplier_products as { supplier_id: string; suppliers: { name: string; phone: string | null; email: string | null } | null }[] | null

      return {
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        sku: p.sku,
        brand: p.brand,
        unit: p.unit,
        stock_current: p.stock_current,
        stock_min: p.stock_min,
        stock_max: p.stock_max,
        price_cost: p.price_cost,
        suggested_qty: suggestedQty,
        supplier: spList?.find(sp => sp.suppliers)?.suppliers ?? null,
      }
    })

  return NextResponse.json({ suggestions })
}
