'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

interface FormState {
  full_name: string; alias: string; dni: string; cuit: string
  email: string; phone: string; address: string; birthday: string
  notes: string; has_account: boolean; credit_limit: string
}

export default function NuevoClientePage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>({
    full_name: '', alias: '', dni: '', cuit: '', email: '', phone: '',
    address: '', birthday: '', notes: '', has_account: false, credit_limit: '',
  })

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
    if (!org) { toast.error('Organización no encontrada'); setLoading(false); return }

    const { data: customer, error } = await supabase.from('customers').insert({
      organization_id: org.id,
      full_name: form.full_name.trim(),
      alias: form.alias || null,
      dni: form.dni || null,
      cuit: form.cuit || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      birthday: form.birthday || null,
      notes: form.notes || null,
      has_account: form.has_account,
      is_active: true,
    }).select('id').single()

    if (error || !customer) {
      toast.error('Error al guardar el cliente')
      setLoading(false)
      return
    }

    if (form.has_account) {
      await supabase.from('current_accounts').insert({
        organization_id: org.id,
        customer_id: customer.id,
        balance: 0,
        credit_limit: form.credit_limit ? parseFloat(form.credit_limit) : null,
      })
    }

    toast.success('Cliente creado')
    router.push(`/${orgSlug}/clientes`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/clientes`} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">Nuevo cliente</h1>
          <p className="text-[13px] text-muted-foreground">Completá los datos del cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Nombre completo *</Label>
              <Input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                placeholder="Ej: María García"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Alias / Apodo</Label>
              <Input value={form.alias} onChange={e => set('alias', e.target.value)}
                placeholder="Ej: La del 2do piso"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Teléfono</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+54 11 1234-5678"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">DNI</Label>
              <Input value={form.dni} onChange={e => set('dni', e.target.value)}
                placeholder="12.345.678"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">CUIT</Label>
              <Input value={form.cuit} onChange={e => set('cuit', e.target.value)}
                placeholder="20-12345678-9"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Email</Label>
              <Input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="cliente@email.com"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Fecha de nacimiento</Label>
              <Input value={form.birthday} onChange={e => set('birthday', e.target.value)}
                type="date"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Dirección</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Dirección del cliente"
              className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Notas</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Preferencias, observaciones..." rows={2}
              className="bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px] resize-none" />
          </div>

          <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-medium">Cuenta corriente</p>
                <p className="text-[12px] text-muted-foreground">Permite fiado y registro de pagos</p>
              </div>
              <Switch checked={form.has_account} onCheckedChange={v => set('has_account', v)} />
            </div>
            {form.has_account && (
              <div className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Límite de crédito (opcional)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground">$</span>
                  <Input value={form.credit_limit} onChange={e => set('credit_limit', e.target.value)}
                    type="number" min="0" placeholder="0.00"
                    className="h-10 pl-6 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/[0.05] flex gap-3 justify-end bg-white/[0.01]">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cliente
          </Button>
        </div>
      </form>
    </div>
  )
}
