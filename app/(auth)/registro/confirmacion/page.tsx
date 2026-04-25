'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ConfirmacionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [orgSlug, setOrgSlug] = useState('')

  useEffect(() => {
    async function linkSubscription() {
      // MP redirects with ?preapproval_id=... after payment
      const preapprovalId = searchParams.get('preapproval_id')
      if (!preapprovalId) { setStatus('error'); return }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not logged in — redirect to registro with the preapproval_id
        router.replace(`/registro?preapproval_id=${preapprovalId}`)
        return
      }

      // Find the org of this user
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, organizations(slug)')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (!member) { setStatus('error'); return }

      const slug = (member.organizations as { slug: string } | null)?.slug ?? ''
      setOrgSlug(slug)

      // Link the MP subscription to this org via API
      await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preapproval_id: preapprovalId, org_id: member.organization_id }),
      })

      setStatus('ok')

      // Redirect to dashboard after 3s
      setTimeout(() => router.replace(`/${slug}/dashboard`), 3000)
    }

    linkSubscription()
  }, [searchParams, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-400 mx-auto" />
          <p className="text-[15px] text-[#8891a8]">Activando tu suscripción...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <XCircle className="h-12 w-12 text-red-400 mx-auto" />
          <h1 className="text-[20px] font-bold text-white">Algo salió mal</h1>
          <p className="text-[14px] text-[#5a6480]">
            No pudimos confirmar el pago. Si ya se procesó, aparecerá activo en las próximas horas.
          </p>
          <Link href="/registro" className="inline-flex items-center text-[14px] text-emerald-400 hover:text-emerald-300">
            Crear cuenta →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-9 w-9 text-emerald-400" />
        </div>
        <h1 className="text-[24px] font-extrabold text-white">¡Suscripción activa!</h1>
        <p className="text-[14px] text-[#8891a8]">
          Tu pago se procesó correctamente. Te redirigimos al dashboard en un momento.
        </p>
        {orgSlug && (
          <Link
            href={`/${orgSlug}/dashboard`}
            className="inline-flex items-center justify-center h-10 px-6 rounded-xl text-[14px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.48 0.25 145))' }}
          >
            Ir al dashboard →
          </Link>
        )}
      </div>
    </div>
  )
}
