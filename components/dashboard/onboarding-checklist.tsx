'use client'

import Link from 'next/link'
import { Package, ShoppingCart, Wallet, CheckCircle2, Circle, Sparkles } from 'lucide-react'

interface Props {
  orgSlug: string
  hasProducts: boolean
  hasOpenSession: boolean
  hasSales: boolean
}

export function OnboardingChecklist({ orgSlug, hasProducts, hasOpenSession, hasSales }: Props) {
  const steps = [
    { done: hasProducts,     label: 'Cargá tu primer producto', cta: 'Ir a productos', href: `/${orgSlug}/productos?catalogo=1`, icon: Package },
    { done: hasOpenSession,  label: 'Abrí la caja',              cta: 'Abrir caja',     href: `/${orgSlug}/caja`,            icon: Wallet },
    { done: hasSales,        label: 'Hacé tu primera venta',     cta: 'Ir al POS',      href: `/${orgSlug}/pos`,             icon: ShoppingCart },
  ]
  const completed = steps.filter(s => s.done).length
  if (completed === steps.length) return null

  return (
    <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-transparent p-5">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-bold text-foreground">Empezá a usar Ventix</p>
        <span className="ml-auto text-[11px] text-muted-foreground font-medium">{completed} de {steps.length}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Tres pasos rápidos y ya podés vender.</p>

      <div className="grid sm:grid-cols-3 gap-3">
        {steps.map(step => {
          const Icon = step.icon
          return (
            <div
              key={step.label}
              className={`rounded-lg border p-3 ${step.done ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-100/40 dark:bg-emerald-900/20' : 'border-border bg-card'}`}
            >
              <div className="flex items-start gap-2">
                {step.done
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  : <Circle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                }
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-semibold ${step.done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {step.label}
                  </p>
                  {!step.done && (
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
                    >
                      <Icon className="h-3 w-3" />
                      {step.cta} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
