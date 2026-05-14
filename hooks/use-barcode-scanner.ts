import { useEffect, useRef, useCallback } from 'react'

interface UseBarcodeOptions {
  minLength?: number
  threshold?: number // max ms between chars to be considered a scan
  cooldownMs?: number // ignore identical scans within this window
}

export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  options: UseBarcodeOptions = {}
) {
  const { minLength = 5, threshold = 50, cooldownMs = 1000 } = options

  const bufferRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })

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
        const code = bufferRef.current
        if (code.length >= minLength) {
          const last = lastScanRef.current
          const isDuplicate = code === last.code && now - last.at < cooldownMs
          if (!isDuplicate) {
            lastScanRef.current = { code, at: now }
            onScan(code)
          }
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
    [onScan, minLength, threshold, cooldownMs, resetBuffer]
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
