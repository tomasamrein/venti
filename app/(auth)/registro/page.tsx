'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Building2, User, Check, ArrowRight, ArrowLeft, Sparkles, Store, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const steps = ['Tu cuenta', 'Tu negocio'] as const
type Step = 0 | 1

const step0Schema = z.object({
  full_name: z.string().min(2, 'Ingresá tu nombre'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
})

const step1Schema = z.object({
  org_name: z.string().min(2, 'Ingresá el nombre de tu negocio'),
  org_slug: z.string().min(2, 'Mínimo 2 caracteres').regex(/^[a-z0-9-]+$/, 'Solo minúsculas, números y guiones'),
  branch_name: z.string().min(2, 'Ingresá el nombre de la sucursal'),
})

type FormData = z.infer<typeof step0Schema> & z.infer<typeof step1Schema>

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

export default function RegistroPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(0)
  const [loading, setLoading] = useState(false)
  const [step0Data, setStep0Data] = useState<z.infer<typeof step0Schema> | null>(null)

  const form0 = useForm<z.infer<typeof step0Schema>>({ resolver: zodResolver(step0Schema) })
  const form1 = useForm<z.infer<typeof step1Schema>>({ resolver: zodResolver(step1Schema) })

  function onStep0(data: z.infer<typeof step0Schema>) {
    setStep0Data(data)
    setStep(1)
  }

  async function onStep1(data: z.infer<typeof step1Schema>) {
    if (!step0Data) return
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...step0Data, ...data }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || 'Error al registrar. Intentá de nuevo.')
        setLoading(false)
        return
      }

      // Sign in the user after successful registration
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

      toast.success(`¡Bienvenido a Venti, ${step0Data.full_name}! 🎉`)
      router.push(`/${data.org_slug}/dashboard`)
      router.refresh()
    } catch {
      toast.error('Error de conexión. Verificá tu internet e intentá de nuevo.')
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
      {/* Left side - Branding (hidden on mobile, shown on lg) */}
      <div className="hidden lg:flex flex-col gap-6 flex-1 max-w-sm">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Empezá a gestionar tu negocio hoy
          </h2>
          <p className="text-muted-foreground">
            Unite a cientos de kioscos y almacenes que ya usan Venti para simplificar su día a día.
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
        <div className="flex items-center gap-3 mb-6">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${i < step
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : i === step
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/40'
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
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
              {step === 0 ? (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-emerald-500" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-emerald-500" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {step === 0 ? 'Creá tu cuenta' : 'Tu negocio'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {step === 0 ? '14 días gratis, sin tarjeta requerida' : 'Podés cambiarlo después'}
                </p>
              </div>
            </div>
          </div>

          {/* Form Body */}
          {step === 0 ? (
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
                    placeholder="juan@mikiosco.com"
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
              </div>
            </form>
          ) : (
            <form onSubmit={form1.handleSubmit(onStep1)}>
              <div className="px-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org_name" className="text-sm font-medium">Nombre del negocio</Label>
                  <Input
                    id="org_name"
                    placeholder="Kiosco El Sol"
                    className="h-11 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                    {...form1.register('org_name')}
                    onChange={(e) => {
                      form1.setValue('org_name', e.target.value)
                      const currentSlug = form1.getValues('org_slug')
                      if (!currentSlug || currentSlug === slugify(form1.getValues('org_name'))) {
                        form1.setValue('org_slug', slugify(e.target.value))
                      }
                    }}
                  />
                  {form1.formState.errors.org_name && (
                    <p className="text-xs text-destructive">{form1.formState.errors.org_name.message}</p>
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
                      placeholder="kiosco-el-sol"
                      className="h-11 rounded-l-none rounded-r-xl bg-muted/50 border-border/60 focus:bg-background transition-colors font-mono"
                      {...form1.register('org_slug')}
                      onChange={(e) => form1.setValue('org_slug', slugify(e.target.value))}
                    />
                  </div>
                  {form1.formState.errors.org_slug && (
                    <p className="text-xs text-destructive">{form1.formState.errors.org_slug.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="branch_name" className="text-sm font-medium">Sucursal principal</Label>
                  <Input
                    id="branch_name"
                    placeholder="Local principal"
                    className="h-11 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                    {...form1.register('branch_name')}
                  />
                  {form1.formState.errors.branch_name && (
                    <p className="text-xs text-destructive">{form1.formState.errors.branch_name.message}</p>
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
                  onClick={() => setStep(0)}
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
