'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Package, ShoppingCart, Wallet, MessageCircle, Sparkles, ArrowRight } from 'lucide-react'

interface Props {
  orgSlug: string
  orgName: string
}

export function WelcomeDialog({ orgSlug, orgName }: Props) {
  const storageKey = `ventix-welcome-seen-${orgSlug}`
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem(storageKey) === '1'
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [storageKey])

  const close = () => {
    localStorage.setItem(storageKey, '1')
    setOpen(false)
  }

  const quickActions = [
    {
      href: `/${orgSlug}/productos?catalogo=1`,
      icon: Package,
      title: 'Cargar mis productos',
      desc: 'Desde el catálogo o importando un Excel',
    },
    {
      href: `/${orgSlug}/caja`,
      icon: Wallet,
      title: 'Abrir la caja',
      desc: 'Con el efectivo que tenés ahora',
    },
    {
      href: `/${orgSlug}/pos`,
      icon: ShoppingCart,
      title: 'Ir directo a vender',
      desc: 'Probá una venta de prueba',
    },
    {
      href: `/${orgSlug}/docs`,
      icon: MessageCircle,
      title: 'Ver la guía',
      desc: 'Respuestas a las dudas más comunes',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) close() }}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 px-6 py-7 text-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">Bienvenido a Ventix</span>
          </div>
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-white text-xl font-bold">
              ¡Listo {orgName}! Empecemos.
            </DialogTitle>
            <DialogDescription className="text-emerald-50 text-[13px]">
              Tenés 14 días de prueba gratis con todo desbloqueado. Elegí por dónde arrancar:
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-4 space-y-2 bg-background">
          {quickActions.map(({ href, icon: Icon, title, desc }) => (
            <Link
              key={href}
              href={href}
              onClick={close}
              className="flex items-center gap-3 rounded-lg border border-border hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 px-3 py-2.5 transition-all group"
            >
              <div className="h-9 w-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{title}</p>
                <p className="text-[11.5px] text-muted-foreground">{desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}

          <button
            onClick={close}
            className="w-full mt-2 text-[12px] text-muted-foreground hover:text-foreground py-2 transition-colors"
          >
            Después, gracias
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
