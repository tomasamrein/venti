'use client'

import { FileText } from 'lucide-react'
import { generateReportPDF, type ReportData } from '@/lib/utils/report-pdf'

interface Props {
  report: ReportData
  label?: string
}

export function PdfExportButton({ report, label = 'Exportar PDF' }: Props) {
  function handleExport() {
    if (!report.rows.length) return
    generateReportPDF(report)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!report.rows.length}
      className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <FileText className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
