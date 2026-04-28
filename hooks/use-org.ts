'use client'

import { useContext } from 'react'
import { OrgContext } from '@/components/providers/org-provider'

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used inside OrgProvider')
  return ctx
}
