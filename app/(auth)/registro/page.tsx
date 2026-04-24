'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Building2, User, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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

const fullSchema = step0Schema.merge(step1Schema)
type FormData = z.infer<typeof fullSchema>

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

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

    const supabase = createClient()

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: step0Data.email,
      password: step0Data.password,
      options: { data: { full_name: step0Data.full_name } },
    })

    if (authError || !authData.user) {
      toast.error(authError?.message || 'Error al crear tu cuenta')
      setLoading(false)
      return
    }

    const userId = authData.user.id
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14)

    // 2. Create organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: data.org_name,
        slug: data.org_slug,
        trial_ends_at: trialEnds.toISOString(),
      })
      .select('id')
      .single()

    if (orgError || !org) {
      toast.error('Error al crear tu negocio. El nombre puede estar en uso.')
      setLoading(false)
      return
    }

    // 3. Create main branch
    const { data: branch, error: branchError } = await supabase
      .from('branches')
      .insert({ organization_id: org.id, name: data.branch_name, is_main: true })
      .select('id')
      .single()

    if (branchError || !branch) {
      toast.error('Error al crear la sucursal')
      setLoading(false)
      return
    }

    // 4. Add user as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
        branch_id: branch.id,
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      toast.error('Error al configurar tu cuenta')
      setLoading(false)
      return
    }

    // 5. Create trial subscription
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('type', 'free_trial')
      .single()

    if (plan) {
      await supabase.from('subscriptions').insert({
        organization_id: org.id,
        plan_id: plan.id,
        status: 'trialing',
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnds.toISOString(),
      })
    }

    toast.success(`¡Bienvenido a Venti, ${step0Data.full_name}! 🎉`)
    router.push(`/${data.org_slug}/dashboard`)
    router.refresh()
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? 'bg-emerald-600 text-white' :
                i === step ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-600' :
                'bg-muted text-muted-foreground'
              }`}>
                {i < step ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>
        <CardTitle className="flex items-center gap-2">
          {step === 0 ? <><User className="h-5 w-5 text-emerald-600" /> Creá tu cuenta</> : <><Building2 className="h-5 w-5 text-emerald-600" /> Tu negocio</>}
        </CardTitle>
        <CardDescription>
          {step === 0 ? '14 días gratis, sin tarjeta requerida' : 'Podés cambiarlo después desde la configuración'}
        </CardDescription>
      </CardHeader>

      {step === 0 ? (
        <form onSubmit={form0.handleSubmit(onStep0)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" placeholder="Juan García" {...form0.register('full_name')} />
              {form0.formState.errors.full_name && <p className="text-xs text-destructive">{form0.formState.errors.full_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="juan@mikiosco.com" {...form0.register('email')} />
              {form0.formState.errors.email && <p className="text-xs text-destructive">{form0.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...form0.register('password')} />
              {form0.formState.errors.password && <p className="text-xs text-destructive">{form0.formState.errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Continuar
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya tenés cuenta?{' '}
              <Link href="/login" className="text-emerald-600 hover:underline font-medium">Ingresá</Link>
            </p>
          </CardFooter>
        </form>
      ) : (
        <form onSubmit={form1.handleSubmit(onStep1)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="org_name">Nombre del negocio</Label>
              <Input
                id="org_name"
                placeholder="Kiosco El Sol"
                {...form1.register('org_name')}
                onChange={(e) => {
                  form1.setValue('org_name', e.target.value)
                  if (!form1.getValues('org_slug')) {
                    form1.setValue('org_slug', slugify(e.target.value))
                  }
                }}
              />
              {form1.formState.errors.org_name && <p className="text-xs text-destructive">{form1.formState.errors.org_name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="org_slug">URL de tu sistema</Label>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">venti.ar/</span>
                <Input
                  id="org_slug"
                  placeholder="kiosco-el-sol"
                  className="flex-1"
                  {...form1.register('org_slug')}
                  onChange={(e) => form1.setValue('org_slug', slugify(e.target.value))}
                />
              </div>
              {form1.formState.errors.org_slug && <p className="text-xs text-destructive">{form1.formState.errors.org_slug.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="branch_name">Nombre de la sucursal principal</Label>
              <Input id="branch_name" placeholder="Local principal" {...form1.register('branch_name')} />
              {form1.formState.errors.branch_name && <p className="text-xs text-destructive">{form1.formState.errors.branch_name.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear mi cuenta gratis
            </Button>
            <button type="button" onClick={() => setStep(0)} className="text-sm text-muted-foreground hover:text-foreground">
              ← Volver
            </button>
          </CardFooter>
        </form>
      )}
    </Card>
  )
}
