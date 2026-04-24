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
      <div className="w-full rounded-2xl border border-white/[0.08] bg-[#0f1320] shadow-2xl shadow-black/60 overflow-hidden"
           style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 24px 80px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <h3 className="text-[20px] font-bold tracking-[-0.025em] text-white">Bienvenido de vuelta</h3>
          <p className="text-[13px] text-[#5a6480] mt-1">Ingresá con tu cuenta para continuar</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-7 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login_email" className="text-[12px] font-semibold text-[#8891a8] uppercase tracking-[0.06em]">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-[#3d4562]" />
                <Input
                  id="login_email"
                  type="email"
                  placeholder="hola@tunegocio.com"
                  autoComplete="email"
                  className="h-11 pl-9 rounded-xl bg-white/[0.05] border-white/[0.08] text-white placeholder:text-[#3d4562] focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors text-[14px]"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-[12px] text-red-400">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login_password" className="text-[12px] font-semibold text-[#8891a8] uppercase tracking-[0.06em]">Contraseña</Label>
                <Link
                  href="/forgot-password"
                  className="text-[12px] text-[#5a6480] hover:text-violet-400 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-[#3d4562]" />
                <Input
                  id="login_password"
                  type="password"
                  autoComplete="current-password"
                  className="h-11 pl-9 rounded-xl bg-white/[0.05] border-white/[0.08] text-white focus:border-violet-500/60 focus:bg-white/[0.07] transition-colors text-[14px]"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="text-[12px] text-red-400">{errors.password.message}</p>}
            </div>
          </div>
          <div className="px-7 pt-6 pb-7 space-y-3">
            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-[14px] font-semibold text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))',
                boxShadow: '0 4px 16px oklch(0.64 0.26 278 / 35%)',
              }}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ingresar
            </Button>
            <p className="text-center text-[13px] text-[#5a6480]">
              ¿No tenés cuenta?{' '}
              <Link href="/registro" className="text-violet-400 hover:text-violet-300 transition-colors font-semibold">
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
