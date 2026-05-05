'use client'

import { jsPDF } from 'jspdf'

interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  discount_pct: number
  tax_rate: number
  subtotal: number
}

interface InvoicePDFData {
  type: string
  number: string
  issuedAt: string | null
  orgName: string
  orgCuit: string
  customerName: string | null
  customerCuit: string | null
  customerAddress: string | null
  items: InvoiceItem[]
  subtotal: number
  tax: number
  total: number
  cae: string | null
  caeVto: string | null
  qrUrl: string | null
}

const TYPE_LABEL: Record<string, string> = {
  A: 'FACTURA A',
  B: 'FACTURA B',
  C: 'FACTURA C',
  ticket: 'TICKET',
  non_fiscal: 'COMPROBANTE',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)

async function fetchQrAsBase64(qrUrl: string): Promise<string | null> {
  try {
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}`
    const res = await fetch(apiUrl)
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise(resolve => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const margin = 15
  let y = margin

  // Header: org name + invoice type box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(data.orgName, margin, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`CUIT: ${data.orgCuit || '—'}`, margin, y + 11)

  // Invoice type box (right)
  const boxX = pageWidth - margin - 35
  doc.setLineWidth(0.5)
  doc.rect(boxX, y, 35, 16)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(data.type.toUpperCase(), boxX + 17.5, y + 11, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`N° ${data.number}`, pageWidth - margin, y + 21, { align: 'right' })

  y += 28

  // Divider
  doc.setLineWidth(0.2)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // Meta
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Fecha:', margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.issuedAt ? new Date(data.issuedAt).toLocaleDateString('es-AR') : '—', margin + 14, y)

  doc.setFont('helvetica', 'bold')
  doc.text('Cliente:', margin + 70, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.customerName ?? 'Consumidor final', margin + 84, y)
  y += 5

  if (data.customerCuit) {
    doc.setFont('helvetica', 'bold')
    doc.text('CUIT/DNI:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(data.customerCuit, margin + 18, y)
    y += 5
  }

  if (data.customerAddress) {
    doc.setFont('helvetica', 'bold')
    doc.text('Dirección:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(data.customerAddress.slice(0, 80), margin + 18, y)
    y += 5
  }

  y += 3

  // Items table
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Descripción', margin + 2, y + 5)
  doc.text('Cant.', margin + 110, y + 5, { align: 'right' })
  doc.text('P. Unit.', margin + 140, y + 5, { align: 'right' })
  doc.text('Subtotal', pageWidth - margin - 2, y + 5, { align: 'right' })
  y += 7

  doc.setFont('helvetica', 'normal')
  for (const item of data.items) {
    if (y > 250) {
      doc.addPage()
      y = margin
    }
    const desc = doc.splitTextToSize(item.description, 90)
    doc.text(desc[0] ?? '', margin + 2, y + 5)
    doc.text(String(item.quantity), margin + 110, y + 5, { align: 'right' })
    doc.text(fmt(item.unit_price), margin + 140, y + 5, { align: 'right' })
    doc.text(fmt(item.subtotal), pageWidth - margin - 2, y + 5, { align: 'right' })
    doc.setLineWidth(0.1)
    doc.line(margin, y + 7, pageWidth - margin, y + 7)
    y += 7
  }

  y += 4

  // Totals (right-aligned)
  const totalsX = pageWidth - margin
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal neto:', totalsX - 35, y)
  doc.text(fmt(data.subtotal), totalsX, y, { align: 'right' })
  y += 5
  doc.text('IVA:', totalsX - 35, y)
  doc.text(fmt(data.tax), totalsX, y, { align: 'right' })
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL:', totalsX - 35, y)
  doc.text(fmt(data.total), totalsX, y, { align: 'right' })
  y += 10

  // CAE block
  if (data.cae) {
    doc.setLineWidth(0.2)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('CAE:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(data.cae, margin + 12, y)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.text('Vto. CAE:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(data.caeVto ? new Date(data.caeVto).toLocaleDateString('es-AR') : '—', margin + 18, y)
    y += 5

    doc.setFontSize(8)
    doc.setTextColor(20, 120, 60)
    doc.text('Comprobante autorizado por ARCA', margin, y)
    doc.setTextColor(0, 0, 0)
    y += 5

    if (data.qrUrl) {
      const qrBase64 = await fetchQrAsBase64(data.qrUrl)
      if (qrBase64) {
        doc.addImage(qrBase64, 'PNG', pageWidth - margin - 30, y - 25, 30, 30)
      }
    }
  }

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Generado por Ventix — ${new Date().toLocaleString('es-AR')}`,
    pageWidth / 2,
    287,
    { align: 'center' },
  )

  doc.save(`factura-${data.type}-${data.number.replace(/-/g, '')}.pdf`)
}
