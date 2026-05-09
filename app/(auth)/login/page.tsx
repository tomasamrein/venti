'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const checkout = searchParams.get('checkout')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
      toast.error('Credenciales incorrectas. Revisá tu email y contraseña.')
      setLoading(false)
      return
    }

    if (checkout === 'basic') {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan_type: 'basic', email: data.email }),
        })
        const json = await res.json()
        if (res.ok && json.init_point) {
          window.location.href = json.init_point
          return
        } else {
          toast.error(json.error || 'No se pudo iniciar el checkout')
        }
      } catch {
        toast.error('Error de conexión al checkout')
      }
    }

    // If explicit redirect param, honor it
    if (redirectTo !== '/') {
      router.push(redirectTo)
      return
    }

    // Resolve destination: super-admin → /admin, org member → /{slug}/dashboard
    const supabase2 = createClient()
    const { data: { user } } = await supabase2.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: profile } = await supabase2
      .from('profiles').select('is_super_admin').eq('id', user.id).single()

    if (profile?.is_super_admin) {
      router.push('/admin')
      return
    }

    const { data: member } = await supabase2
      .from('organization_members')
      .select('organizations(slug)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    const slug = (member?.organizations as { slug: string } | null)?.slug
    router.push(slug ? `/${slug}/dashboard` : '/registro')
  }

  return (
    <div className="w-full max-w-md">
      <div className="w-full rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-7 pt-7 pb-5">
          <h3 className="text-xl font-bold text-foreground">Bienvenido de vuelta</h3>
          <p className="text-sm text-muted-foreground mt-1">Ingresá con tu cuenta para continuar</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login_email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login_email"
                  type="email"
                  placeholder="hola@tunegocio.com"
                  autoComplete="email"
                  className="h-11 pl-9"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login_password">Contraseña</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="login_password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 pl-9"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>

          <div className="px-7 pt-6 pb-7 space-y-3">
            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{' '}
              <Link href="/registro" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">
                Registrate gratis
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
