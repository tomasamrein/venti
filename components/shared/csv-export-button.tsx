'use client'

import { Download } from 'lucide-react'

interface CsvExportButtonProps {
  data: Record<string, unknown>[]
  filename: string
  label?: string
}

export function CsvExportButton({ data, filename, label = 'Exportar CSV' }: CsvExportButtonProps) {
  function handleExport() {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const rows = data.map(row =>
      headers.map(h => {
        const val = row[h]
        if (val === null || val === undefined) return ''
        const str = String(val)
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str
      }).join(','),
    )
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!data.length}
      className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-border bg-white text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
