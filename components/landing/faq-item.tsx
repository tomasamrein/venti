'use client'

import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

export function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-900 leading-snug">{q}</span>
        {open
          ? <Minus className="h-4 w-4 text-emerald-600 shrink-0" />
          : <Plus className="h-4 w-4 text-slate-400 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-6 pb-5 text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-4">
          {a}
        </div>
      )}
    </div>
  )
}
