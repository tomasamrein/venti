export type PlanType =
  | 'free_trial'
  | 'basic'
  | 'basic_annual'
  | 'pro'
  | 'pro_annual'
  | 'professional'

export interface PlanLimits {
  maxBranches: number
  maxUsers: number
  isAnnual: boolean
  isTrial: boolean
  tier: 'trial' | 'starter' | 'business' | 'enterprise'
}

const INFINITE = 999

export function getPlanLimits(planType: string | null | undefined): PlanLimits {
  switch (planType) {
    case 'free_trial':
      return { maxBranches: 1, maxUsers: 2, isAnnual: false, isTrial: true, tier: 'trial' }
    case 'basic':
      return { maxBranches: 1, maxUsers: 2, isAnnual: false, isTrial: false, tier: 'starter' }
    case 'basic_annual':
      return { maxBranches: 1, maxUsers: 2, isAnnual: true, isTrial: false, tier: 'starter' }
    case 'pro':
      return { maxBranches: 1, maxUsers: INFINITE, isAnnual: false, isTrial: false, tier: 'business' }
    case 'pro_annual':
      return { maxBranches: 1, maxUsers: INFINITE, isAnnual: true, isTrial: false, tier: 'business' }
    case 'professional':
      return { maxBranches: INFINITE, maxUsers: INFINITE, isAnnual: false, isTrial: false, tier: 'enterprise' }
    default:
      return { maxBranches: 1, maxUsers: 2, isAnnual: false, isTrial: true, tier: 'trial' }
  }
}

/** Plan permite multi-sucursal */
export function hasMultiBranch(planType: string | null | undefined): boolean {
  return getPlanLimits(planType).maxBranches > 1
}

/** Plan tier business o superior (pro, pro_annual, professional) */
export function isBusinessTier(planType: string | null | undefined): boolean {
  const t = getPlanLimits(planType).tier
  return t === 'business' || t === 'enterprise'
}

/** Plan habilita facturación ARCA. Trial sí (para probar), Simple no, Avanzado+ sí. */
export function hasInvoicing(planType: string | null | undefined): boolean {
  if (!planType) return false
  if (planType === 'basic' || planType === 'basic_annual') return false
  return true
}

/** Plan tier enterprise (professional) */
export function isEnterpriseTier(planType: string | null | undefined): boolean {
  return getPlanLimits(planType).tier === 'enterprise'
}

/** Trial activo (no expirado) */
export function isTrialPlan(planType: string | null | undefined): boolean {
  return getPlanLimits(planType).isTrial
}

/** Plan pago (no trial) */
export function isPaidPlan(planType: string | null | undefined): boolean {
  return !isTrialPlan(planType)
}

/** Label legible del plan */
export function getPlanLabel(planType: string | null | undefined): string {
  switch (planType) {
    case 'free_trial': return 'Prueba gratis'
    case 'basic': return 'Simple'
    case 'basic_annual': return 'Simple Anual'
    case 'pro': return 'Avanzado'
    case 'pro_annual': return 'Avanzado Anual'
    case 'professional': return 'Profesional'
    default: return 'Sin plan'
  }
}
