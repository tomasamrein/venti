'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle2, XCircle, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface InvitationInfo {
  token: string
  email: string
  role: string
  org_name: string
  org_slug: string
  inviter_name: string
  expired: boolean
  accepted: boolean
}

export default function InvitePage() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [info, setInfo] = useState<InvitationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Registration form state (if user doesn't have account)
  const [needsRegister, setNeedsRegister] = useState(false)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function fetchInvitation() {
      const res = await fetch(`/api/invitations/${token}`)
      if (!res.ok) { setError('La invitación no es válida o expiró.'); setLoading(false); return }
      const data = await res.json()
      setInfo(data)
      setLoading(false)

      // Check if user already logged in
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.email?.toLowerCase() === data.email.toLowerCase()) {
          await acceptInvitation(token, supabase, data.org_slug)
        } else {
          setError(`Esta invitación es para ${data.email}. Iniciá sesión con esa cuenta.`)
        }
      } else {
        // Check if account exists → login flow or register flow
        setNeedsRegister(true)
      }
    }
    fetchInvitation()
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  async function acceptInvitation(tok: string, supabase: ReturnType<typeof createClient>, orgSlug: string) {
    const res = await fetch(`/api/invitations/${tok}/accept`, { method: 'POST' })
    if (!res.ok) { toast.error('Error al aceptar la invitación'); return }
    setDone(true)
    setTimeout(() => router.push(`/${orgSlug}/dashboard`), 1500)
  }

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!info) return
    if (!fullName.trim()) { toast.error('Ingresá tu nombre'); return }
    if (password.length < 6) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
    setSubmitting(true)
    const supabase = createClient()

    // Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: info.email, password })
    if (!signInError) {
      await acceptInvitation(token, supabase, info.org_slug)
      setSubmitting(false)
      return
    }

    // Register new account
    const { error: signUpError } = await supabase.auth.signUp({
      email: info.email,
      password,
      options: { data: { full_name: fullName.trim() } },
    })
    if (signUpError) {
      toast.error('Error al crear la cuenta. Probá con otra contraseña.')
      setSubmitting(false)
      return
    }

    await acceptInvitation(token, supabase, info.org_slug)
    setSubmitting(false)
  }

  const roleLabel = info?.role === 'admin' ? 'Admin' : 'Cajero'

  if (loading) {
    return (
      <div className="w-full max-w-md flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Verificando invitación...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">Invitación no válida</h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Link href="/login">
          <Button variant="outline" className="rounded-xl">Ir al inicio de sesión</Button>
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="w-full max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-emerald-900 mb-2">¡Bienvenido a {info?.org_name}!</h2>
        <p className="text-sm text-emerald-700">Redirigiendo al dashboard...</p>
      </div>
    )
  }

  if (info?.expired || info?.accepted) {
    return (
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <XCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-2">{info.accepted ? 'Invitación ya usada' : 'Invitación expirada'}</h2>
        <p className="text-sm text-muted-foreground mb-6">Pedí al dueño que te envíe una nueva invitación.</p>
        <Link href="/login">
          <Button variant="outline" className="rounded-xl">Ir al inicio de sesión</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-7 pt-7 pb-5 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[14px] font-semibold">{info?.org_name}</p>
              <p className="text-[12px] text-muted-foreground">Rol: {roleLabel}</p>
            </div>
          </div>
          <h3 className="text-xl font-bold">Aceptar invitación</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Ingresá con tu cuenta o creá una nueva para unirte.
          </p>
        </div>

        {needsRegister && (
          <form onSubmit={handleAccept} className="px-7 py-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Email</Label>
              <Input value={info?.email} disabled className="h-10 bg-muted/30 border-border rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Tu nombre *</Label>
              <Input
                value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Nombre completo"
                className="h-10 bg-muted/30 border-border rounded-xl text-[14px]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Contraseña *</Label>
              <Input
                type="password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="h-10 bg-muted/30 border-border rounded-xl text-[14px]"
              />
              <p className="text-[11px] text-muted-foreground">Si ya tenés cuenta, usá tu contraseña actual.</p>
            </div>
            <Button
              type="submit" disabled={submitting}
              className="w-full h-11 rounded-xl text-white font-semibold"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.16 155), oklch(0.50 0.16 158))' }}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Unirme a {info?.org_name}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
