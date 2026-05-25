import { NextResponse } from 'next/server'

interface LookupResult {
  name: string
  brand: string | null
  image_url: string | null
}

// Cache en memoria por barcode (vive mientras el server esté caliente).
const cache = new Map<string, LookupResult | null>()

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const barcode = (searchParams.get('barcode') ?? '').trim()

  if (!/^\d{6,14}$/.test(barcode)) {
    return NextResponse.json({ error: 'Código inválido' }, { status: 400 })
  }

  if (cache.has(barcode)) {
    const cached = cache.get(barcode)
    if (!cached) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    return NextResponse.json(cached)
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,image_url`,
      {
        headers: { 'User-Agent': 'Venti-POS/1.0 (tomasamrein72@gmail.com)' },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!res.ok) {
      cache.set(barcode, null)
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const json = await res.json()
    const name = (json?.product?.product_name ?? '').trim()

    if (json?.status !== 1 || !name) {
      cache.set(barcode, null)
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const result: LookupResult = {
      name,
      brand: (json.product.brands ?? '').split(',')[0]?.trim() || null,
      image_url: json.product.image_url || null,
    }
    cache.set(barcode, result)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Error al consultar' }, { status: 502 })
  }
}
