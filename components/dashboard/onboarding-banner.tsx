'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Rocket, ArrowRight, X } from 'lucide-react'

interface Props {
  orgSlug: string
  hasProducts: boolean
  hasSales: boolean
  hasCashSession: boolean
  hasTeam: boolean
  hasBusinessInfo: boolean
}

export function OnboardingBanner({
  orgSlug,
  hasProducts,
  hasSales,
  hasCashSession,
  hasTeam,
  hasBusinessInfo,
}: Props) {
  const storageKey = `ventix-onboarding-collapsed-${orgSlug}`
  const dismissKey = `ventix-onboarding-dismissed-${orgSlug}`
  const [collapsed, setCollapsed] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setCollapsed(localStorage.getItem(storageKey) === '1')
      setDismissed(localStorage.getItem(dismissKey) === '1')
    }
  }, [storageKey, dismissKey])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(storageKey, next ? '1' : '0')
  }

  const dismiss = () => {
    setDismissed(true)
    localStorage.setItem(dismissKey, '1')
  }

  const steps = [
    {
      label: 'Cargá tu primer producto',
      hint: 'Para arrancar a vender. Después subís todo con Excel.',
      href: `/${orgSlug}/productos/nuevo`,
      done: hasProducts,
    },
    {
      label: 'Completá los datos del negocio',
      hint: 'Nombre, dirección, teléfono — sale en los tickets.',
      href: `/${orgSlug}/configuracion`,
      done: hasBusinessInfo,
    },
    {
      label: 'Abrí la caja del día',
      hint: 'Con el efectivo que tengas en ese momento.',
      href: `/${orgSlug}/caja`,
      done: hasCashSession,
    },
    {
      label: 'Hacé tu primera venta',
      hint: 'Escaneando o tocando un producto.',
      href: `/${orgSlug}/pos`,
      done: hasSales,
    },
    {
      label: 'Invitá a tu equipo',
      hint: 'Si trabajás con alguien más (opcional).',
      href: `/${orgSlug}/configuracion/equipo`,
      done: hasTeam,
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const total = steps.length
  const allDone = doneCount === total
  const pct = Math.round((doneCount / total) * 100)

  if (!mounted) return null

  if (allDone || dismissed) return null

  if (collapsed) {
    return (
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-4 py-3 transition-colors group"
      >
        <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Rocket className="h-3.5 w-3.5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[13px] font-semibold text-emerald-900">Primeros pasos · {doneCount}/{total}</p>
          <div className="mt-1 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-emerald-600 group-hover:text-emerald-800" />
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 relative">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={toggle}
          className="text-emerald-500 hover:text-emerald-800 transition-colors flex items-center gap-1 text-[11px] font-semibold"
          aria-label="Minimizar"
        >
          Minimizar <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={dismiss}
          className="text-emerald-400 hover:text-emerald-700 transition-colors"
          aria-label="Cerrar"
          title="No mostrar más"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
          <Rocket className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-[15px] font-bold text-emerald-900">Primeros pasos · {doneCount}/{total}</p>
          <p className="text-[12px] text-emerald-700">En menos de 15 minutos tenés todo listo para vender</p>
        </div>
      </div>

      <div className="mb-4 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-1.5">
        {steps.map((step, idx) => (
          <Link
            key={step.label}
            href={step.done ? '#' : step.href}
            className={`flex items-start gap-3 rounded-lg px-2 py-2 transition-colors ${step.done ? 'pointer-events-none opacity-60' : 'hover:bg-emerald-100'}`}
          >
            <div className="mt-0.5 shrink-0">
              {step.done
                ? <CheckCircle2 className="h-[18px] w-[18px] text-emerald-600" />
                : <Circle className="h-[18px] w-[18px] text-emerald-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[13px] font-semibold ${step.done ? 'line-through text-emerald-700' : 'text-emerald-900'}`}>
                  {idx + 1}. {step.label}
                </span>
                {!step.done && <ArrowRight className="h-3 w-3 text-emerald-500" />}
              </div>
              {!step.done && (
                <p className="text-[11.5px] text-emerald-700/80 mt-0.5">{step.hint}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
