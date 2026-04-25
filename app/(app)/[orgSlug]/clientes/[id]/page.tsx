'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, CreditCard, Phone, Mail, MapPin, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { formatARS } from '@/lib/utils/currency'

interface FormState {
  full_name: string; alias: string; dni: string; cuit: string
  email: string; phone: string; address: string; birthday: string
  notes: string; has_account: boolean; is_active: boolean
}

interface AccountData {
  id: string; balance: number; credit_limit: number | null
}

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const clientId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [orgId, setOrgId] = useState('')
  const [account, setAccount] = useState<AccountData | null>(null)
  const [form, setForm] = useState<FormState>({
    full_name: '', alias: '', dni: '', cuit: '', email: '', phone: '',
    address: '', birthday: '', notes: '', has_account: false, is_active: true,
  })

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
      if (!org) { router.replace(`/${orgSlug}/clientes`); return }
      setOrgId(org.id)

      const { data: c } = await supabase
        .from('customers').select('*, current_accounts(id, balance, credit_limit)')
        .eq('id', clientId).single()
      if (!c) { toast.error('Cliente no encontrado'); router.replace(`/${orgSlug}/clientes`); return }

      setForm({
        full_name: c.full_name ?? '', alias: c.alias ?? '', dni: c.dni ?? '',
        cuit: c.cuit ?? '', email: c.email ?? '', phone: c.phone ?? '',
        address: c.address ?? '', birthday: c.birthday ?? '',
        notes: c.notes ?? '', has_account: c.has_account ?? false,
        is_active: c.is_active ?? true,
      })

      const accts = Array.isArray(c.current_accounts) ? c.current_accounts : []
      if (accts.length > 0) setAccount(accts[0] as AccountData)
      setFetching(false)
    }
    load()
  }, [clientId, orgSlug, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.from('customers').update({
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
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    }).eq('id', clientId).eq('organization_id', orgId)

    if (error) { toast.error('Error al guardar'); setLoading(false); return }

    if (form.has_account && !account) {
      await supabase.from('current_accounts').insert({
        organization_id: orgId, customer_id: clientId, balance: 0,
      })
    }

    toast.success('Cliente actualizado')
    router.push(`/${orgSlug}/clientes`)
  }

  if (fetching) {
    return (
      <div className="max-w-2xl">
        <div className="h-8 w-48 rounded-lg bg-white/[0.05] animate-pulse mb-4" />
        <div className="rounded-xl border border-white/[0.07] bg-card h-96 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/clientes`} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">{form.full_name}</h1>
          <p className="text-[13px] text-muted-foreground">Editar cliente</p>
        </div>
      </div>

      {account && (
        <div className="rounded-xl border border-white/[0.07] bg-card card-shadow p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-muted-foreground">Cuenta corriente</p>
              <p className={`text-[20px] font-extrabold tracking-[-0.03em] ${account.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {formatARS(account.balance)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {account.credit_limit && (
              <Badge variant="outline" className="text-[11px] border-white/10 text-muted-foreground">
                Límite {formatARS(account.credit_limit)}
              </Badge>
            )}
            <Link href={`/${orgSlug}/cuentas-corrientes/${account.id}`} className="h-7 px-3 text-[12px] rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 inline-flex items-center transition-colors">
              Ver movimientos
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Nombre completo *</Label>
              <Input value={form.full_name} onChange={e => set('full_name', e.target.value)}
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Alias</Label>
              <Input value={form.alias} onChange={e => set('alias', e.target.value)}
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                <Phone className="h-3 w-3" />Teléfono
              </Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">DNI</Label>
              <Input value={form.dni} onChange={e => set('dni', e.target.value)}
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">CUIT</Label>
              <Input value={form.cuit} onChange={e => set('cuit', e.target.value)}
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                <Mail className="h-3 w-3" />Email
              </Label>
              <Input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                <Calendar className="h-3 w-3" />Fecha de nacimiento
              </Label>
              <Input value={form.birthday} onChange={e => set('birthday', e.target.value)}
                type="date" className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
              <MapPin className="h-3 w-3" />Dirección
            </Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)}
              className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Notas</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2} className="bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px] resize-none" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3">
            <div>
              <p className="text-[14px] font-medium">Cuenta corriente</p>
              <p className="text-[12px] text-muted-foreground">Permite fiado y registro de pagos</p>
            </div>
            <Switch checked={form.has_account} onCheckedChange={v => set('has_account', v)} />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3">
            <div>
              <p className="text-[14px] font-medium">Cliente activo</p>
              <p className="text-[12px] text-muted-foreground">Aparece en búsquedas y en el POS</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/[0.05] flex gap-3 justify-end bg-white/[0.01]">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  )
}
