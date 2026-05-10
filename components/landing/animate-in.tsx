'use client'

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

interface Props {
  children: ReactNode
  delay?: number
  className?: string
  from?: 'bottom' | 'left' | 'right' | 'none'
}

export function AnimateIn({ children, delay = 0, className = '', from = 'bottom' }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const initial: Record<string, CSSProperties> = {
    bottom: { opacity: 0, transform: 'translateY(28px)' },
    left:   { opacity: 0, transform: 'translateX(-28px)' },
    right:  { opacity: 0, transform: 'translateX(28px)' },
    none:   { opacity: 0, transform: 'none' },
  }

  return (
    <div
      ref={ref}
      className={className}
      style={
        visible
          ? { opacity: 1, transform: 'none', transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }
          : { ...initial[from], transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms` }
      }
    >
      {children}
    </div>
  )
}
