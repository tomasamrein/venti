import { useEffect, useRef, useCallback } from 'react'

interface UseBarcodeOptions {
  minLength?: number
  timeout?: number
  threshold?: number
}

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: UseBarcodeOptions = {}
) {
  const {
    minLength = 5,
    timeout = 200,
    threshold = 50,
  } = options

  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  const resetBuffer = useCallback(() => {
    bufferRef.current = ''
    lastKeyTimeRef.current = 0
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const now = Date.now()

    // Reset si pasó demasiado tiempo sin teclas
    if (now - lastKeyTimeRef.current > timeout * 3) {
      bufferRef.current = ''
    }

    // Enter = completar scan
    if (e.key === 'Enter') {
      if (bufferRef.current.length >= minLength) {
        onScan(bufferRef.current)
        resetBuffer()
        return
      }
    }

    // Acumular chars si está siendo escaneado rápido (< threshold ms)
    if (now - lastKeyTimeRef.current < threshold || bufferRef.current.length > 0) {
      if (e.key.length === 1 || e.key === 'Backspace') {
        if (e.key === 'Backspace') {
          bufferRef.current = bufferRef.current.slice(0, -1)
        } else {
          bufferRef.current += e.key
        }
        lastKeyTimeRef.current = now

        // Auto-timeout si es input normal (escribir lentamente)
        if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
        if (bufferRef.current.length > 0) {
          timeoutIdRef.current = setTimeout(() => {
            bufferRef.current = ''
          }, timeout * 5)
        }
      }
    }
  }, [onScan, minLength, timeout, threshold, resetBuffer])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
    }
  }, [handleKeyDown])

  return { resetBuffer }
}
