'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const REMEMBER_KEY = 'ventix-remember-me'
const SESSION_KEY = 'ventix-session-alive'

export function RememberMeGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const remember = localStorage.getItem(REMEMBER_KEY)
    const sessionAlive = sessionStorage.getItem(SESSION_KEY)

    if (remember === '0' && !sessionAlive) {
      createClient().auth.signOut().then(() => {
        window.location.href = '/login'
      })
      return
    }
    sessionStorage.setItem(SESSION_KEY, '1')
  }, [])

  return null
}
