import { NextResponse } from 'next/server'

export interface CatalogSearchResult {
  barcode: string
  name: string
  brand: string | null
  image_url: string | null
}

const cache = new Map<string, CatalogSearchResult[]>()

async function fetchOFF(searchTerms: string | null): Promise<CatalogSearchResult[]> {
  const base =
    'https://world.openfoodfacts.org/cgi/search.pl?action=process&json=1' +
    '&tagtype_0=countries&tag_contains_0=contains&tag_0=argentina' +
    '&fields=code,product_name,brands,image_small_url&page_size=100&sort_by=popularity_key'

  const url = searchTerms
    ? base + `&search_terms=${encodeURIComponent(searchTerms)}`
    : base

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Venti-POS/1.0 (tomasamrein72@gmail.com)' },
    signal: AbortSignal.timeout(8000),
  })

  if (!res.ok) return []

  const json = await res.json()
  const products: unknown[] = Array.isArray(json?.products) ? json.products : []

  const seen = new Set<string>()
  const results: CatalogSearchResult[] = []
  for (const p of products) {
    const prod = p as Record<string, unknown>
    const code = String(prod.code ?? '').trim()
    const name = String(prod.product_name ?? '').trim()
    if (!code || !name || seen.has(code)) continue
    seen.add(code)
    results.push({
      barcode: code,
      name,
      brand: String(prod.brands ?? '').split(',')[0]?.trim() || null,
      image_url: (prod.image_small_url as string) || null,
    })
  }
  return results
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') ?? '').trim()

  // q vacío → productos populares de Argentina (para el browse inicial)
  if (q === '') {
    const key = '__popular__'
    if (cache.has(key)) return NextResponse.json({ results: cache.get(key) })
    try {
      const results = await fetchOFF(null)
      cache.set(key, results)
      return NextResponse.json({ results })
    } catch {
      return NextResponse.json({ results: [] })
    }
  }

  if (q.length < 2) return NextResponse.json({ results: [] })

  const key = q.toLowerCase()
  if (cache.has(key)) return NextResponse.json({ results: cache.get(key) })

  try {
    const results = await fetchOFF(q)
    cache.set(key, results)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
