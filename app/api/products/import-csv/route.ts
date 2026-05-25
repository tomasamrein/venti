import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const productRowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  unit: z.string().optional().default('un'),
  price_cost: z.coerce.number().optional().nullable(),
  price_sell: z.coerce.number().min(0).default(0),
  price_sell_b: z.coerce.number().optional().nullable(),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(21),
  stock_current: z.coerce.number().optional().default(0),
  stock_min: z.coerce.number().optional().default(0),
  category: z.string().optional().nullable(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { org_id, rows } = body as { org_id: string; rows: unknown[] }

  if (!org_id || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  // Verify membership
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', org_id)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (!member || member.role === 'cashier') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const admin = createAdminClient()

  // Resolve category names → ids (create if missing)
  const categoryNames = [...new Set(
    rows.map((r: unknown) => (r as Record<string, unknown>).category as string)
      .filter((c): c is string => Boolean(c) && c.trim().length > 0)
      .map(c => c.trim())
  )]

  const categoryMap: Record<string, string> = {}
  for (const name of categoryNames) {
    const { data: existing } = await admin
      .from('product_categories')
      .select('id')
      .eq('organization_id', org_id)
      .eq('name', name)
      .maybeSingle()

    if (existing) {
      categoryMap[name] = existing.id
    } else {
      const { data: created } = await admin
        .from('product_categories')
        .insert({ organization_id: org_id, name })
        .select('id')
        .single()
      if (created) categoryMap[name] = created.id
    }
  }

  const parsed: z.infer<typeof productRowSchema>[] = []
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const result = productRowSchema.safeParse(rows[i])
    if (!result.success) {
      errors.push(`Fila ${i + 2}: ${result.error.issues[0].message}`)
    } else {
      parsed.push(result.data)
    }
  }

  if (errors.length > rows.length / 2) {
    return NextResponse.json({ error: 'Demasiados errores en el archivo', errors }, { status: 422 })
  }

  const toInsert = parsed.map(p => ({
    organization_id: org_id,
    name: p.name,
    description: p.description || null,
    barcode: p.barcode || null,
    sku: p.sku || null,
    brand: p.brand || null,
    unit: p.unit || 'un',
    price_cost: p.price_cost ?? null,
    price_sell: p.price_sell,
    price_sell_b: p.price_sell_b ?? null,
    tax_rate: p.tax_rate ?? 21,
    stock_current: p.stock_current ?? 0,
    stock_min: p.stock_min ?? 0,
    category_id: p.category ? (categoryMap[p.category] ?? null) : null,
    track_stock: true,
    is_active: true,
  }))

  // Upsert by barcode (if barcode exists), otherwise insert
  const withBarcode = toInsert.filter(p => p.barcode)
  const withoutBarcode = toInsert.filter(p => !p.barcode)

  let inserted = 0
  let updated = 0

  if (withBarcode.length) {
    const { data, error } = await admin
      .from('products')
      .upsert(withBarcode, { onConflict: 'organization_id,barcode', ignoreDuplicates: false })
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    inserted += data?.length ?? 0
  }

  if (withoutBarcode.length) {
    const { data, error } = await admin
      .from('products')
      .insert(withoutBarcode)
      .select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    inserted += data?.length ?? 0
  }

  return NextResponse.json({ success: true, inserted, updated, skipped_errors: errors })
}
