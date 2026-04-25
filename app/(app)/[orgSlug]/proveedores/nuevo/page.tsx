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

const CATEGORIES = ['Alimentos', 'Bebidas', 'Lácteos', 'Congelados', 'Limpieza', 'Golosinas', 'Cigarrillos', 'Papel e higiene', 'Farmacia', 'Otro']

interface FormState {
  name: string; alias: string; cuil: string; cuit: string
  email: string; phone: string; address: string; category: string
  contact_name: string; notes: string; is_active: boolean
}

const empty: FormState = {
  name: '', alias: '', cuil: '', cuit: '', email: '', phone: '',
  address: '', category: '', contact_name: '', notes: '', is_active: true,
}

export default function NuevoProveedorPage() {
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.orgSlug as string
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormState>(empty)

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return }
    setLoading(true)
    const supabase = createClient()
    const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
    if (!org) { toast.error('Organización no encontrada'); setLoading(false); return }

    const { error } = await supabase.from('suppliers').insert({
      organization_id: org.id,
      name: form.name.trim(),
      alias: form.alias || null,
      cuil: form.cuil || null,
      cuit: form.cuit || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      category: form.category || null,
      contact_name: form.contact_name || null,
      notes: form.notes || null,
      is_active: form.is_active,
    })

    if (error) {
      toast.error('Error al guardar el proveedor')
      setLoading(false)
      return
    }
    toast.success('Proveedor creado')
    router.push(`/${orgSlug}/proveedores`)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${orgSlug}/proveedores`} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-[24px] font-extrabold tracking-[-0.03em]">Nuevo proveedor</h1>
          <p className="text-[13px] text-muted-foreground">Completá los datos del proveedor</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Nombre *</Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Nombre o razón social"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Alias</Label>
              <Input value={form.alias} onChange={e => set('alias', e.target.value)}
                placeholder="Ej: La Serenísima"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">CUIT</Label>
              <Input value={form.cuit} onChange={e => set('cuit', e.target.value)}
                placeholder="20-12345678-9"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">CUIL</Label>
              <Input value={form.cuil} onChange={e => set('cuil', e.target.value)}
                placeholder="20-12345678-9"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Teléfono</Label>
              <Input value={form.phone} onChange={e => set('phone', e.target.value)}
                placeholder="+54 11 1234-5678"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Email</Label>
              <Input value={form.email} onChange={e => set('email', e.target.value)}
                type="email" placeholder="ventas@proveedor.com"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Nombre de contacto</Label>
              <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                placeholder="Juan García"
                className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Categoría</Label>
              <select
                value={form.category}
                onChange={e => set('category', e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[14px] text-foreground focus:outline-none focus:border-violet-500/50"
              >
                <option value="">Sin categoría</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Dirección</Label>
            <Input value={form.address} onChange={e => set('address', e.target.value)}
              placeholder="Dirección del proveedor"
              className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Notas</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Condiciones de pago, observaciones..." rows={3}
              className="bg-white/[0.04] border-white/[0.08] rounded-xl text-[14px] resize-none" />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.05] px-4 py-3">
            <div>
              <p className="text-[14px] font-medium">Activo</p>
              <p className="text-[12px] text-muted-foreground">Aparece en listados y búsquedas</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/[0.05] flex gap-3 justify-end bg-white/[0.01]">
          <Button type="button" variant="ghost" className="rounded-xl" onClick={() => router.back()}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar proveedor
          </Button>
        </div>
      </form>
    </div>
  )
}
