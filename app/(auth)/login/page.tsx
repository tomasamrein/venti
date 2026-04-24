'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, LogIn, Mail, Lock } from 'lucide-react'
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
  const redirect = searchParams.get('redirect') || '/'
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

    router.push(redirect)
    router.refresh()
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-xl shadow-black/5 dark:shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <LogIn className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Bienvenido de vuelta</h3>
              <p className="text-xs text-muted-foreground">Ingresá con tu cuenta para continuar</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login_email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  id="login_email"
                  type="email"
                  placeholder="hola@tunegocio.com"
                  autoComplete="email"
                  className="h-11 pl-10 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login_password" className="text-sm font-medium">Contraseña</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                <Input
                  id="login_password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 pl-10 rounded-xl bg-muted/50 border-border/60 focus:bg-background transition-colors"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
          </div>
          <div className="px-6 pt-5 pb-6 space-y-3">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-emerald-500/30 transition-all duration-200"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tenés cuenta?{' '}
              <Link href="/registro" className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold">
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
