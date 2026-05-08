import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgBySlug } from '@/lib/supabase/get-org'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { startOfDay, startOfMonth, startOfYear, getDaysInMonth } from 'date-fns'

const TZ = 'America/Argentina/Buenos_Aires'
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const orgSlug = searchParams.get('orgSlug')
  const period = searchParams.get('period') ?? 'day'
  const branchId = searchParams.get('branchId') ?? null

  if (!orgSlug) return NextResponse.json({ error: 'Missing orgSlug' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const org = await getOrgBySlug(orgSlug)
  if (!org) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Date range
  const nowUtc = new Date()
  const nowAR = toZonedTime(nowUtc, TZ)
  const startDateAR = period === 'year' ? startOfYear(nowAR)
    : period === 'month' ? startOfMonth(nowAR)
    : startOfDay(nowAR)
  const startISO = fromZonedTime(startDateAR, TZ).toISOString()

  // All queries in parallel — single sales query with nested sale_items (1 round-trip instead of 2 sequential)
  let salesQuery = supabase
    .from('sales')
    .select('id, total, payment_method, completed_at, created_at, sale_number, customers(full_name), sale_items(product_id, name, quantity, subtotal)')
    .eq('organization_id', org.id)
    .eq('status', 'completed')
    .gte('created_at', startISO)
    .order('created_at', { ascending: false })

  if (branchId) salesQuery = salesQuery.eq('branch_id', branchId)

  const [
    { data: sales },
    { count: totalProducts },
    { count: lowStockCount },
    { data: openSession },
  ] = await Promise.all([
    salesQuery,
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_active', true),
    supabase.from('stock_alerts').select('*', { count: 'exact', head: true }).eq('organization_id', org.id).eq('is_resolved', false),
    supabase.from('cash_sessions').select('opening_amount').eq('organization_id', org.id).eq('status', 'open').maybeSingle(),
  ])

  const totalAmount = sales?.reduce((s, v) => s + v.total, 0) ?? 0
  const totalCount = sales?.length ?? 0

  // Chart data
  let chartData: { label: string; total: number }[] = []
  if (period === 'day') {
    const hourMap: Record<string, number> = {}
    for (let h = 8; h <= 22; h++) hourMap[`${h}hs`] = 0
    sales?.forEach(sale => {
      const h = toZonedTime(new Date(sale.created_at), TZ).getHours()
      const key = `${h}hs`
      if (key in hourMap) hourMap[key] = (hourMap[key] ?? 0) + sale.total
    })
    chartData = Object.entries(hourMap).map(([label, total]) => ({ label, total }))
  } else if (period === 'month') {
    const days = getDaysInMonth(nowAR)
    const dayMap: Record<number, number> = {}
    for (let d = 1; d <= days; d++) dayMap[d] = 0
    sales?.forEach(sale => {
      const d = toZonedTime(new Date(sale.created_at), TZ).getDate()
      dayMap[d] = (dayMap[d] ?? 0) + sale.total
    })
    chartData = Object.entries(dayMap).map(([d, total]) => ({ label: d, total }))
  } else {
    const monthMap: Record<number, number> = {}
    for (let m = 0; m < 12; m++) monthMap[m] = 0
    sales?.forEach(sale => {
      const m = toZonedTime(new Date(sale.created_at), TZ).getMonth()
      monthMap[m] = (monthMap[m] ?? 0) + sale.total
    })
    chartData = Object.entries(monthMap).map(([m, total]) => ({ label: MONTHS[Number(m)], total }))
  }

  // Top 5 products (from nested sale_items)
  const productTotals: Record<string, { name: string; quantity: number; total: number }> = {}
  sales?.forEach(sale => {
    const items = (sale.sale_items as any[]) ?? []
    items.forEach((item: any) => {
      const key = item.product_id ?? item.name
      if (!productTotals[key]) productTotals[key] = { name: item.name, quantity: 0, total: 0 }
      productTotals[key].quantity += item.quantity
      productTotals[key].total += item.subtotal
    })
  })
  const topProducts = Object.values(productTotals).sort((a, b) => b.quantity - a.quantity).slice(0, 5)

  // Recent sales (last 8)
  const recentSales = (sales ?? []).slice(0, 8).map(s => ({
    id: s.id,
    sale_number: s.sale_number,
    total: s.total,
    payment_method: s.payment_method,
    completed_at: s.completed_at,
    created_at: s.created_at,
    customer_name: (s.customers as any)?.full_name ?? null,
  }))

  return NextResponse.json({
    totalAmount,
    totalCount,
    totalProducts: totalProducts ?? 0,
    lowStockCount: lowStockCount ?? 0,
    openSession: openSession ? { opening_amount: openSession.opening_amount } : null,
    chartData,
    topProducts,
    recentSales,
  })
}
