import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export interface ParsedPriceRow {
  barcode: string | null
  sku: string | null
  name: string | null
  price_sell: number | null
  price_cost: number | null
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const sheet = workbook.worksheets[0]
    if (!sheet) return NextResponse.json({ error: 'El archivo no tiene hojas' }, { status: 400 })

    // Read headers from row 1
    const headers: Record<number, string> = {}
    sheet.getRow(1).eachCell((cell, col) => {
      headers[col] = String(cell.value ?? '').toLowerCase().trim()
    })

    const colIdx = (names: string[]): number | null => {
      for (const [col, h] of Object.entries(headers)) {
        if (names.some(n => h.includes(n))) return parseInt(col)
      }
      return null
    }

    const cols = {
      barcode: colIdx(['barcode', 'codigo', 'código', 'cod_barra', 'ean', 'codebar']),
      sku: colIdx(['sku', 'codigo_interno', 'internal_code', 'referencia']),
      name: colIdx(['nombre', 'name', 'producto', 'descripcion', 'descripción']),
      price_sell: colIdx(['precio_venta', 'price_sell', 'precio', 'venta', 'pvp', 'p_venta']),
      price_cost: colIdx(['precio_costo', 'price_cost', 'costo', 'cost', 'p_costo']),
    }

    const rows: ParsedPriceRow[] = []

    sheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return

      const getStr = (col: number | null): string | null => {
        if (!col) return null
        const v = row.getCell(col).value
        if (v == null) return null
        const s = String(v).trim()
        return s || null
      }

      const getNum = (col: number | null): number | null => {
        if (!col) return null
        const v = row.getCell(col).value
        if (v == null) return null
        const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.').replace(/[^0-9.-]/g, ''))
        return isNaN(n) || n < 0 ? null : n
      }

      const parsed: ParsedPriceRow = {
        barcode: getStr(cols.barcode),
        sku: getStr(cols.sku),
        name: getStr(cols.name),
        price_sell: getNum(cols.price_sell),
        price_cost: getNum(cols.price_cost),
      }

      const hasId = parsed.barcode || parsed.sku || parsed.name
      const hasPrice = parsed.price_sell != null || parsed.price_cost != null
      if (hasId && hasPrice) rows.push(parsed)
    })

    return NextResponse.json({ rows, total: rows.length })
  } catch (err) {
    console.error('parse-excel error:', err)
    return NextResponse.json({ error: 'Error al procesar el archivo Excel' }, { status: 500 })
  }
}
