'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Las contraseñas no coinciden', path: ['confirm'] })

type FormData = z.infer<typeof schema>

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [exchanging, setExchanging] = useState(true)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) { setExchanging(false); return }
    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code)
      .then(({ error }) => {
        if (error) toast.error('El link expiró o ya fue usado. Pedí uno nuevo.')
      })
      .finally(() => setExchanging(false))
  }, [searchParams])

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      toast.error('No se pudo actualizar la contraseña. Intentá de nuevo.')
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  if (exchanging) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (done) {
    return (
      <Card className="shadow-lg">
        <CardContent className="py-10 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto" />
          <p className="text-sm font-semibold text-foreground">¡Contraseña actualizada!</p>
          <p className="text-sm text-muted-foreground">Redirigiendo al login…</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
          <KeyRound className="h-5 w-5 text-emerald-600" />
          <CardTitle>Nueva contraseña</CardTitle>
        </div>
        <CardDescription>Elegí una contraseña segura de al menos 8 caracteres</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">Nueva contraseña</Label>
            <Input id="password" type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar contraseña</Label>
            <Input id="confirm" type="password" placeholder="Repetí la contraseña" autoComplete="new-password" {...register('confirm')} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar contraseña
          </Button>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="h-3 w-3" /> Volver al login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
