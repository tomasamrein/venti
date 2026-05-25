'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Loader2, Building2, User, Check, ArrowRight, ArrowLeft, Sparkles,
  Store, Shield, ShoppingBag, Printer, HelpCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type BusinessType = 'kiosco' | 'almacen' | 'drugstore' | 'fotocopiadora' | 'otro'

const BUSINESS_TYPES: {
  value: BusinessType
  label: string
  description: string
  icon: React.ElementType
}[] = [
  { value: 'kiosco',       label: 'Kiosco',                 description: 'Golosinas, bebidas y snacks',     icon: ShoppingBag },
  { value: 'almacen',      label: 'Almacén / Autoservicio', description: 'Productos variados y fiambrería', icon: Store },
  { value: 'drugstore',    label: 'Drugstore',               description: 'Perfumería y productos 24hs',     icon: Shield },
  { value: 'fotocopiadora',label: 'Fotocopiadora',           description: 'Copias, anillado e impresión',    icon: Printer },
  { value: 'otro',         label: 'Otro comercio',           description: 'Minimarket, librería u otro',     icon: HelpCircle },
]

const steps = ['Tu cuenta', 'Tu negocio', 'Tu local'] as const
type Step = 0 | 1 | 2

const step0Schema = z.object({
  full_name: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

const step2Schema = z.object({
  org_name: z.string().min(2, 'Ingresá el nombre de tu negocio'),
  org_slug: z.string().min(2, 'Mínimo 2 caracteres').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  branch_name: z.string().min(2, 'Ingresá el nombre de la sucursal'),
})

type FormData = z.infer<typeof step0Schema> & z.infer<typeof step2Schema> & { business_type: BusinessType }

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const features = [
  { icon: Store, text: 'Punto de venta ágil' },
  { icon: Shield, text: 'Gestión de stock' },
  { icon: Sparkles, text: '14 días gratis' },
]

function RegistroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>(0)
  const [loading, setLoading] = useState(false)
  const [step0Data, setStep0Data] = useState<z.infer<typeof step0Schema> | null>(null)
  const rubroParam = searchParams.get('rubro') as BusinessType | null
  const [businessType, setBusinessType] = useState<BusinessType | null>(
    rubroParam && BUSINESS_TYPES.some(b => b.value === rubroParam) ? rubroParam : null
  )
  const [existingUser, setExistingUser] = useState<{ id: string; full_name: string; email: string } | null>(null)

  const form0 = useForm<z.infer<typeof step0Schema>>({ resolver: zodResolver(step0Schema) })
  const form2 = useForm<z.infer<typeof step2Schema>>({ resolver: zodResolver(step2Schema) })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: member } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()
      if (member) {
        router.replace('/')
        return
      }
      setExistingUser({
        id: user.id,
        full_name: user.user_metadata?.full_name ?? '',
        email: user.email ?? '',
      })
      setStep(1)
    })
  }, [router])

  function onStep0(data: z.infer<typeof step0Schema>) {
    setStep0Data(data)
    setStep(1)
  }

  function onStep1() {
    if (!businessType) return
    setStep(2)
  }

  async function onStep2(data: z.infer<typeof step2Schema>) {
    if (!businessType) return
    setLoading(true)

    try {
      if (existingUser) {
        const res = await fetch('/api/org/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...data, business_type: businessType }),
        })
        const result = await res.json()
        if (!res.ok) {
          toast.error(result.error || 'Error al crear el negocio.')
          setLoading(false)
          return
        }
        toast.success(`¡Bienvenido a Ventix, ${existingUser.full_name || 'usuario'}!`)
        router.push(`/${data.org_slug}/dashboard`)
        router.refresh()
        return
      }

      if (!step0Data) return

      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...step0Data, ...data, business_type: businessType }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Error al registrar. Intentá de nuevo.')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: step0Data.email,
        password: step0Data.password,
      })

      if (signInError) {
        toast.error('Cuenta creada, pero hubo un error al iniciar sesión. Probá ingresar desde el login.')
        router.push('/login')
        return
      }

      toast.success(`¡Bienvenido a Ventix, ${step0Data.full_name}!`)
      router.push(`/${data.org_slug}/dashboard`)
      router.refresh()
    } catch {
      toast.error('Error de conexión. Verificá tu internet e intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col gap-6 flex-1 max-w-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Empezá a gestionar tu negocio hoy
          </h2>
          <p className="text-muted-foreground">
            Unite a cientos de negocios que ya usan Ventix para simplificar su día a día.
          </p>
        </div>
        <div className="space-y-4">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-emerald-500" />
              </div>
              <span className="text-sm font-medium text-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full max-w-md flex-shrink-0">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 shrink-0
                ${i < step
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : i === step
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/40'
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-foreground font-semibold' : 'text-muted-foreground'} hidden sm:block`}>
                {label}
              </span>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-emerald-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                {step === 0 ? <User className="h-5 w-5 text-emerald-500" /> : <Building2 className="h-5 w-5 text-emerald-500" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {step === 0 ? 'Creá tu cuenta' : step === 1 ? '¿Qué tipo de negocio tenés?' : 'Datos de tu negocio'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {step === 0 ? '14 días gratis, sin tarjeta requerida' : step === 1 ? 'El sistema se adapta a tu rubro' : 'Podés cambiarlo después'}
                </p>
              </div>
            </div>
          </div>

          {/* Step 0 — Account */}
          {step === 0 && (
            <form onSubmit={form0.handleSubmit(onStep0)}>
              <div className="px-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="full_name" className="text-sm font-medium">Nombre completo</Label>
                  <Input
                    id="full_name"
                    placeholder="Juan García"
                    className="h-11 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                    {...form0.register('full_name')}
                  />
                  {form0.formState.errors.full_name && (
                    <p className="text-xs text-destructive">{form0.formState.errors.full_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg_email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="reg_email"
                    type="email"
                    placeholder="juan@minegocio.com"
                    className="h-11 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                    {...form0.register('email')}
                  />
                  {form0.formState.errors.email && (
                    <p className="text-xs text-destructive">{form0.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg_password" className="text-sm font-medium">Contraseña</Label>
                  <Input
                    id="reg_password"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    className="h-11 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                    {...form0.register('password')}
                  />
                  {form0.formState.errors.password && (
                    <p className="text-xs text-destructive">{form0.formState.errors.password.message}</p>
                  )}
                </div>
              </div>
              <div className="px-6 pt-5 pb-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all duration-200"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  ¿Ya tenés cuenta?{' '}
                  <Link href="/login" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
                    Ingresá
                  </Link>
                </p>
                <p className="text-center text-xs text-muted-foreground/60">
                  Al registrarte aceptás los{' '}
                  <Link href="/terminos" target="_blank" className="hover:text-muted-foreground transition-colors underline underline-offset-2">Términos y condiciones</Link>
                  {' y la '}
                  <Link href="/privacidad" target="_blank" className="hover:text-muted-foreground transition-colors underline underline-offset-2">Política de privacidad</Link>
                </p>
              </div>
            </form>
          )}

          {/* Step 1 — Business Type */}
          {step === 1 && (
            <div>
              <div className="px-6 pb-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {BUSINESS_TYPES.map(({ value, label, description, icon: Icon }) => {
                    const selected = businessType === value
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setBusinessType(value)}
                        className={`
                          relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all duration-150
                          ${selected
                            ? 'border-emerald-500 bg-emerald-500/8 dark:bg-emerald-500/10'
                            : 'border-border/60 bg-muted/30 hover:border-border hover:bg-muted/60'
                          }
                        `}
                      >
                        {selected && (
                          <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </span>
                        )}
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${selected ? 'bg-emerald-500/15' : 'bg-background'}`}>
                          <Icon className={`h-5 w-5 ${selected ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold leading-tight ${selected ? 'text-foreground' : 'text-foreground/80'}`}>
                            {label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="px-6 pt-4 pb-6 space-y-3">
                <Button
                  type="button"
                  onClick={onStep1}
                  disabled={!businessType}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                {!existingUser && (
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="flex items-center justify-center gap-1.5 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Volver
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 2 — Business Info */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(onStep2)}>
              <div className="px-6 space-y-4">
                {/* Selected type badge */}
                {businessType && (() => {
                  const bt = BUSINESS_TYPES.find(b => b.value === businessType)!
                  const Icon = bt.icon
                  return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Icon className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{bt.label}</span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        cambiar
                      </button>
                    </div>
                  )
                })()}
                <div className="space-y-1.5">
                  <Label htmlFor="org_name" className="text-sm font-medium">Nombre del negocio</Label>
                  <Input
                    id="org_name"
                    placeholder="Fotocopiadora El Centro"
                    className="h-11 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                    {...form2.register('org_name')}
                    onChange={(e) => {
                      form2.setValue('org_name', e.target.value)
                      const currentSlug = form2.getValues('org_slug')
                      if (!currentSlug || currentSlug === slugify(form2.getValues('org_name'))) {
                        form2.setValue('org_slug', slugify(e.target.value))
                      }
                    }}
                  />
                  {form2.formState.errors.org_name && (
                    <p className="text-xs text-destructive">{form2.formState.errors.org_name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org_slug" className="text-sm font-medium">URL de tu sistema</Label>
                  <div className="flex items-center gap-0">
                    <span className="h-11 inline-flex items-center px-3 rounded-l-xl border border-r-0 border-border/60 bg-muted/80 text-sm text-muted-foreground font-mono">
                      venti.ar/
                    </span>
                    <Input
                      id="org_slug"
                      placeholder="foto-el-centro"
                      className="h-11 rounded-l-none rounded-r-xl bg-muted/50 border-border/60 focus:bg-background transition-colors font-mono"
                      {...form2.register('org_slug')}
                      onChange={(e) => form2.setValue('org_slug', slugify(e.target.value))}
                    />
                  </div>
                  {form2.formState.errors.org_slug && (
                    <p className="text-xs text-destructive">{form2.formState.errors.org_slug.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="branch_name" className="text-sm font-medium">Sucursal principal</Label>
                  <Input
                    id="branch_name"
                    placeholder="Local principal"
                    autoComplete="off"
                    className="h-11 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                    {...form2.register('branch_name')}
                  />
                  {form2.formState.errors.branch_name && (
                    <p className="text-xs text-destructive">{form2.formState.errors.branch_name.message}</p>
                  )}
                </div>
              </div>
              <div className="px-6 pt-5 pb-6 space-y-3">
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all duration-200"
                  disabled={loading}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear mi cuenta gratis
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Volver
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroContent />
    </Suspense>
  )
}
