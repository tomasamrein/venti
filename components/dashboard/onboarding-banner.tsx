'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, X, Rocket } from 'lucide-react'

interface Props {
  orgSlug: string
  hasProducts: boolean
  hasSales: boolean
  hasCashSession: boolean
}

export function OnboardingBanner({ orgSlug, hasProducts, hasSales, hasCashSession }: Props) {
  const storageKey = `ventix-onboarding-dismissed-${orgSlug}`
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setDismissed(localStorage.getItem(storageKey) === '1')
    }
  }, [storageKey])

  const steps = [
    { label: 'Agregá tu primer producto', href: `/${orgSlug}/productos/nuevo`, done: hasProducts },
    { label: 'Abrí tu primera caja', href: `/${orgSlug}/caja`, done: hasCashSession },
    { label: 'Realizá tu primera venta', href: `/${orgSlug}/pos`, done: hasSales },
  ]

  const allDone = steps.every(s => s.done)
  const doneCount = steps.filter(s => s.done).length

  if (!mounted || dismissed || allDone) return null

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 relative">
      <button
        onClick={() => {
          localStorage.setItem(storageKey, '1')
          setDismissed(true)
        }}
        className="absolute top-4 right-4 text-emerald-400 hover:text-emerald-600 transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Rocket className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-emerald-900">Primeros pasos ({doneCount}/3)</p>
          <p className="text-[12px] text-emerald-700">Completá estos pasos para aprovechar Ventix al máximo</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {steps.map(step => (
          <Link
            key={step.label}
            href={step.done ? '#' : step.href}
            className={`flex items-center gap-3 text-[13px] transition-opacity ${step.done ? 'opacity-50 pointer-events-none' : 'hover:opacity-80'}`}
          >
            {step.done
              ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              : <Circle className="h-4 w-4 text-emerald-400 shrink-0" />
            }
            <span className={step.done ? 'line-through text-emerald-700' : 'text-emerald-900 font-medium'}>
              {step.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
