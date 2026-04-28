'use client'

import { createContext, type ReactNode } from 'react'
import type { Database } from '@/types/database'

type Org = Pick<Database['public']['Tables']['organizations']['Row'],
  'id' | 'name' | 'slug' | 'timezone' | 'currency' | 'settings' | 'is_active' | 'trial_ends_at'>

type Branch = Pick<Database['public']['Tables']['branches']['Row'],
  'id' | 'name' | 'is_main'>

type MemberRole = Database['public']['Enums']['member_role']

interface OrgContextValue {
  org: Org
  branch: Branch
  role: MemberRole
  userId: string
  userFullName: string | null
}

export const OrgContext = createContext<OrgContextValue | null>(null)

interface OrgProviderProps {
  children: ReactNode
  value: OrgContextValue
}

export function OrgProvider({ children, value }: OrgProviderProps) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}
