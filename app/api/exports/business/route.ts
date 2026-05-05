import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ExcelJS from 'exceljs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orgSlug = searchParams.get('org')
  if (!orgSlug) return NextResponse.json({ error: 'Falta org' }, { status: 400 })

  const { data: org } = await supabase.from('organizations').select('id, name').eq('slug', orgSlug).single()
  if (!org) return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })

  const { data: member } = await supabase.from('organization_members')
    .select('role').eq('organization_id', org.id).eq('user_id', user.id).eq('is_active', true).single()
  if (!member) return NextResponse.json({ error: 'Sin acceso' }, { status: 403 })

  const admin = createAdminClient()

  const [products, customers, suppliers, sales] = await Promise.all([
    admin.from('products')
      .select('name, barcode, sku, brand, unit, price_cost, price_sell, stock_current, stock_min')
      .eq('organization_id', org.id).eq('is_active', true).order('name'),
    admin.from('customers')
      .select('full_name, alias, dni, cuit, email, phone, address, birthday, notes, has_account')
      .eq('organization_id', org.id).eq('is_active', true).order('full_name'),
    admin.from('suppliers')
      .select('name, alias, cuit, email, phone, address, contact_name, category, notes')
      .eq('organization_id', org.id).eq('is_active', true).order('name'),
    admin.from('sales')
      .select('sale_number, status, payment_method, subtotal, discount_amount, tax_amount, total, completed_at, created_at')
      .eq('organization_id', org.id)
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5000),
  ])

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Ventix'
  wb.created = new Date()

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16A34A' } },
    alignment: { horizontal: 'left' },
  }

  function addSheet(name: string, headers: string[], rows: (string | number | null | undefined)[][]) {
    const ws = wb.addWorksheet(name)
    ws.addRow(headers)
    ws.getRow(1).eachCell(cell => { cell.style = headerStyle })
    ws.getRow(1).height = 20
    rows.forEach(r => ws.addRow(r))
    ws.columns.forEach(col => {
      let max = 10
      col.eachCell?.({ includeEmpty: false }, cell => {
        const len = String(cell.value ?? '').length
        if (len > max) max = len
      })
      col.width = Math.min(max + 2, 40)
    })
    return ws
  }

  addSheet('Productos', [
    'Nombre', 'Código de barras', 'SKU', 'Marca', 'Unidad',
    'Precio costo', 'Precio venta', 'Stock actual', 'Stock mínimo',
  ], (products.data ?? []).map(p => [
    p.name, p.barcode ?? '', p.sku ?? '', p.brand ?? '', p.unit,
    p.price_cost ?? 0, p.price_sell, p.stock_current, p.stock_min,
  ]))

  addSheet('Clientes', [
    'Nombre', 'Alias', 'DNI', 'CUIT', 'Email', 'Teléfono', 'Dirección', 'Nacimiento', 'Cuenta corriente', 'Notas',
  ], (customers.data ?? []).map(c => [
    c.full_name, c.alias ?? '', c.dni ?? '', c.cuit ?? '', c.email ?? '',
    c.phone ?? '', c.address ?? '', c.birthday ?? '',
    c.has_account ? 'Sí' : 'No', c.notes ?? '',
  ]))

  addSheet('Proveedores', [
    'Nombre', 'Alias', 'CUIT', 'Email', 'Teléfono', 'Dirección', 'Contacto', 'Categoría', 'Notas',
  ], (suppliers.data ?? []).map(s => [
    s.name, s.alias ?? '', s.cuit ?? '', s.email ?? '', s.phone ?? '',
    s.address ?? '', s.contact_name ?? '', s.category ?? '', s.notes ?? '',
  ]))

  addSheet('Ventas (últimos 12 meses)', [
    'Nro. venta', 'Estado', 'Medio de pago', 'Subtotal', 'Descuento', 'IVA', 'Total', 'Fecha',
  ], (sales.data ?? []).map(s => [
    s.sale_number ?? '', s.status, s.payment_method,
    s.subtotal, s.discount_amount, s.tax_amount, s.total,
    s.completed_at ? new Date(s.completed_at).toLocaleDateString('es-AR') : '',
  ]))

  const buffer = await wb.xlsx.writeBuffer()
  const filename = `ventix-export-${org.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.xlsx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
