'use client'

import { useEffect } from 'react'

interface PosShortcutsOptions {
  onCheckout: () => void
  onClearCart: () => void
  onFocusSearch?: () => void
  cartEmpty: boolean
  disabled?: boolean
}

export function usePosShortcuts({ onCheckout, onClearCart, onFocusSearch, cartEmpty, disabled }: PosShortcutsOptions) {
  useEffect(() => {
    if (disabled) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'F2') {
        e.preventDefault()
        if (!cartEmpty) onCheckout()
        return
      }

      if (e.key === 'F3') {
        e.preventDefault()
        if (!cartEmpty) onClearCart()
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        onFocusSearch?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCheckout, onClearCart, onFocusSearch, cartEmpty, disabled])
}
