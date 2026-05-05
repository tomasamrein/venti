'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CreditCard, CheckCircle2, Clock, AlertCircle, Zap, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatARS } from '@/lib/utils/currency'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Plan {
  id: string
  name: string
  type: string
  price_ars: number
  max_branches: number
  max_users: number
  features: Record<string, unknown>
}

interface Subscription {
  id: string
  status: string
  current_period_end: string | null
  canceled_at: string | null
  plan: Plan | null
}

const STATUS_INFO: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  trialing: { label: 'Trial gratuito', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', icon: Clock },
  active: { label: 'Activa', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  past_due: { label: 'Pago vencido', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: AlertCircle },
  canceled: { label: 'Cancelada', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: AlertCircle },
  paused: { label: 'Pausada', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', icon: AlertCircle },
}

export default function SuscripcionPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [fetching, setFetching] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUserEmail(user?.email ?? null)

      const { data: org } = await supabase
        .from('organizations').select('id, trial_ends_at').eq('slug', orgSlug).single()
      if (!org) return
      setOrgId(org.id)
      setTrialEndsAt(org.trial_ends_at)

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id, status, current_period_end, canceled_at, plan:subscription_plans(id, name, type, price_ars, max_branches, max_users, features)')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      setSubscription(sub as unknown as Subscription)

      const { data: allPlans } = await supabase
        .from('subscription_plans').select('*').eq('is_active', true).order('price_ars')
      setPlans((allPlans ?? []) as Plan[])
      setFetching(false)
    }
    load()
  }, [orgSlug])

  const status = subscription?.status ?? 'trialing'
  const statusInfo = STATUS_INFO[status] ?? STATUS_INFO.trialing
  const StatusIcon = statusInfo.icon

  async function handleCheckout(plan: Plan) {
    if (plan.type === 'pro') {
      window.open(`https://wa.me/5492604000000?text=Hola%2C+quiero+info+sobre+el+plan+Enterprise+de+Venti`, '_blank')
      return
    }
    const email = userEmail ?? window.prompt('Ingresá tu email:')
    if (!email?.includes('@')) { toast.error('Email inválido'); return }
    setCheckoutLoading(plan.id)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_type: plan.type, email, org_id: orgId }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Error al iniciar el pago'); return }
      window.location.href = json.init_point
    } catch {
      toast.error('Error de red')
    } finally {
      setCheckoutLoading(null)
    }
  }

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000))
    : null

  if (fetching) {
    return (
      <div className="max-w-2xl space-y-4">
        {[1, 2].map(i => <div key={i} className="h-40 rounded-xl border border-border bg-card animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Suscripción</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Tu plan actual y opciones de facturación</p>
      </div>

      {/* Current status */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[14px] font-semibold">Estado actual</h2>
        </div>
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${statusInfo.color}`}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </span>
            </div>
            <p className="text-[22px] font-extrabold tracking-tight">
              {subscription?.plan?.name ?? 'Trial gratuito'}
            </p>
            {subscription?.plan && (
              <p className="text-[14px] text-muted-foreground">
                {formatARS(subscription.plan.price_ars)} / mes
              </p>
            )}
            {status === 'trialing' && trialDaysLeft !== null && (
              <p className="text-[13px] text-amber-400">
                {trialDaysLeft > 0
                  ? `Te quedan ${trialDaysLeft} días de prueba gratuita`
                  : 'Tu período de prueba venció'}
              </p>
            )}
            {subscription?.current_period_end && status === 'active' && (
              <p className="text-[12px] text-muted-foreground">
                Próximo cobro: {new Date(subscription.current_period_end).toLocaleDateString('es-AR')}
              </p>
            )}
          </div>
          {subscription?.plan && (
            <div className="text-right space-y-1 text-[12px] text-muted-foreground">
              <p>Hasta {subscription.plan.max_branches === 1 ? '1 sucursal' : `${subscription.plan.max_branches} sucursales`}</p>
              <p>Hasta {subscription.plan.max_users} usuarios</p>
            </div>
          )}
        </div>
      </div>

      {/* Plans */}
      {plans.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-[14px] font-semibold text-muted-foreground uppercase tracking-wider">Planes disponibles</h2>
          <div className="grid gap-3">
            {plans.filter(p => p.type !== 'free_trial').map(plan => {
              const isCurrent = subscription?.plan?.id === plan.id
              const isPro = plan.type === 'pro'
              return (
                <div key={plan.id}
                  className={`rounded-xl border p-5 flex items-center justify-between gap-4 transition-colors ${isCurrent ? 'border-emerald-300/40 bg-emerald-600/5' : 'border-border bg-card hover:border-slate-300'}`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isPro && <Zap className="h-3.5 w-3.5 text-amber-400" />}
                      <p className="text-[15px] font-bold">{plan.name}</p>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-600">
                          Plan actual
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-muted-foreground">
                      {plan.max_branches === 1 ? '1 sucursal' : `${plan.max_branches} sucursales`} · hasta {plan.max_users} usuarios
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[20px] font-extrabold">
                      {plan.type === 'pro' ? 'A consultar' : formatARS(plan.price_ars)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">por mes</p>
                    {!isCurrent && (
                      <Button size="sm" className="mt-2 rounded-lg text-[12px] text-white"
                        disabled={checkoutLoading === plan.id}
                        style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}
                        onClick={() => handleCheckout(plan)}>
                        {checkoutLoading === plan.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : plan.type === 'pro' ? 'Consultar' : (subscription?.status === 'active' ? 'Cambiar plan' : 'Suscribirme')}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[12px] text-muted-foreground text-center">
            Para cambiar de plan o cancelar tu suscripción, contactanos por WhatsApp o email.
          </p>
        </div>
      )}
    </div>
  )
}
