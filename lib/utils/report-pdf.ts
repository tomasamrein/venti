import { jsPDF } from 'jspdf'

export interface ReportColumn {
  key: string
  label: string
  align?: 'left' | 'right'
  width?: number // mm
}

export interface ReportStat {
  label: string
  value: string
}

export interface ReportData {
  title: string
  subtitle?: string
  orgName: string
  stats?: ReportStat[]
  columns: ReportColumn[]
  rows: Record<string, string | number | null | undefined>[]
  filename: string
}

export function generateReportPDF(data: ReportData): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' })
  const pageW = 297
  const pageH = 210
  const margin = 12
  let y = margin

  // Header
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(data.orgName, margin, y + 5)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text(`Generado ${new Date().toLocaleString('es-AR')}`, pageW - margin, y + 5, { align: 'right' })
  doc.setTextColor(0, 0, 0)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(data.title, margin, y)
  y += 5
  if (data.subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(data.subtitle, margin, y)
    doc.setTextColor(0, 0, 0)
    y += 5
  }
  y += 3

  // Stats row
  if (data.stats?.length) {
    const statW = (pageW - margin * 2) / data.stats.length
    data.stats.forEach((s, i) => {
      const x = margin + i * statW
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.2)
      doc.rect(x, y, statW - 2, 14)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(120, 120, 120)
      doc.text(s.label.toUpperCase(), x + 3, y + 5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.text(s.value, x + 3, y + 11)
    })
    y += 18
  }

  // Table headers
  const totalCustomWidth = data.columns.reduce((s, c) => s + (c.width ?? 0), 0)
  const remaining = pageW - margin * 2 - totalCustomWidth
  const undefinedCols = data.columns.filter(c => !c.width).length
  const defaultWidth = undefinedCols > 0 ? remaining / undefinedCols : 0
  const colWidths = data.columns.map(c => c.width ?? defaultWidth)

  function drawHeader() {
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y, pageW - margin * 2, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(60, 60, 60)
    let x = margin + 2
    data.columns.forEach((c, i) => {
      const w = colWidths[i]
      doc.text(c.label, c.align === 'right' ? x + w - 4 : x, y + 5, { align: c.align === 'right' ? 'right' : 'left' })
      x += w
    })
    doc.setTextColor(0, 0, 0)
    y += 7
  }

  drawHeader()

  // Rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const row of data.rows) {
    if (y > pageH - 15) {
      doc.addPage()
      y = margin
      drawHeader()
    }
    let x = margin + 2
    data.columns.forEach((c, i) => {
      const w = colWidths[i]
      const v = row[c.key]
      const str = v == null ? '' : String(v)
      const truncated = str.length > Math.floor(w / 1.6) ? str.slice(0, Math.floor(w / 1.6) - 1) + '…' : str
      doc.text(truncated, c.align === 'right' ? x + w - 4 : x, y + 5, { align: c.align === 'right' ? 'right' : 'left' })
      x += w
    })
    doc.setDrawColor(235, 235, 235)
    doc.setLineWidth(0.1)
    doc.line(margin, y + 7, pageW - margin, y + 7)
    y += 7
  }

  // Footer
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(120, 120, 120)
    doc.text(`Página ${i} de ${pages} · Generado por Ventix`, pageW / 2, pageH - 5, { align: 'center' })
  }

  doc.save(data.filename)
}
