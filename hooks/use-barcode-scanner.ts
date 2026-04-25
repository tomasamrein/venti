import { useEffect, useRef, useCallback } from 'react'

interface UseBarcodeOptions {
  minLength?: number
  threshold?: number // max ms between chars to be considered a scan
}

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: UseBarcodeOptions = {}
) {
  const { minLength = 5, threshold = 50 } = options

  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetBuffer = useCallback(() => {
    bufferRef.current = ''
    lastKeyTimeRef.current = 0
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const now = Date.now()
      const delta = now - lastKeyTimeRef.current

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minLength) {
          onScan(bufferRef.current)
        }
        resetBuffer()
        return
      }

      if (e.key.length !== 1) return

      // Reset buffer if too much time passed — this was regular typing
      if (lastKeyTimeRef.current !== 0 && delta > threshold * 3) {
        bufferRef.current = ''
      }

      bufferRef.current += e.key
      lastKeyTimeRef.current = now

      // Auto-clear buffer after inactivity (catches partial scans without Enter)
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = setTimeout(() => {
        bufferRef.current = ''
        lastKeyTimeRef.current = 0
      }, threshold * 10)
    },
    [onScan, minLength, threshold, resetBuffer]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current)
    }
  }, [handleKeyDown])

  return { resetBuffer }
}
