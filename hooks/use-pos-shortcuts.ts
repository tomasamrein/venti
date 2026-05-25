'use client'

import { useEffect } from 'react'

interface PosShortcutsOptions {
  onCheckout: () => void
  onClearCart: () => void
  cartEmpty: boolean
  disabled?: boolean
}

function isInputFocused() {
  const el = document.activeElement as HTMLElement | null
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
}

export function usePosShortcuts({ onCheckout, onClearCart, cartEmpty, disabled }: PosShortcutsOptions) {
  useEffect(() => {
    if (disabled) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        case 'p':
          // P → cobrar (pagar)
          if (isInputFocused()) return
          e.preventDefault()
          if (!cartEmpty) onCheckout()
          break

        case 'delete':
          // Delete → limpiar carrito
          if (isInputFocused()) return
          e.preventDefault()
          if (!cartEmpty) onClearCart()
          break

        case '/':
          // / → foco en búsqueda de productos
          if (isInputFocused()) return
          e.preventDefault()
          ;(document.querySelector<HTMLInputElement>('input[placeholder*="Buscar producto"]'))?.focus()
          break

        case 'escape':
          // Escape → quitar foco del buscador y volver al grid
          if (isInputFocused()) (document.activeElement as HTMLElement)?.blur()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCheckout, onClearCart, cartEmpty, disabled])
}
