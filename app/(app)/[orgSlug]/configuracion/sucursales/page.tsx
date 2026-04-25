'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Plus, Pencil, Loader2, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Branch {
  id: string
  name: string
  address: string | null
  phone: string | null
  is_main: boolean
  is_active: boolean
}

const empty = (): Omit<Branch, 'id' | 'is_main' | 'is_active'> => ({ name: '', address: '', phone: '' })

export default function SucursalesPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [orgId, setOrgId] = useState('')
  const [myRole, setMyRole] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [fetching, setFetching] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
      if (!org) return
      setOrgId(org.id)
      const { data: me } = await supabase.from('organization_members')
        .select('role').eq('organization_id', org.id).eq('user_id', user.id).single()
      if (me) setMyRole(me.role)
      await loadBranches(org.id)
    }
    load()
  }, [orgSlug])

  async function loadBranches(oId: string) {
    setFetching(true)
    const supabase = createClient()
    const { data } = await supabase.from('branches').select('*')
      .eq('organization_id', oId).order('is_main', { ascending: false })
    setBranches((data ?? []) as Branch[])
    setFetching(false)
  }

  function openNew() { setEditing(null); setForm(empty()); setOpen(true) }
  function openEdit(b: Branch) { setEditing(b); setForm({ name: b.name, address: b.address ?? '', phone: b.phone ?? '' }); setOpen(true) }

  async function handleSave() {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    const supabase = createClient()
    if (editing) {
      const { error } = await supabase.from('branches').update({
        name: form.name.trim(),
        address: form.address || null,
        phone: form.phone || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id)
      if (error) toast.error('Error al guardar')
      else { toast.success('Sucursal actualizada'); setOpen(false); await loadBranches(orgId) }
    } else {
      const { error } = await supabase.from('branches').insert({
        organization_id: orgId,
        name: form.name.trim(),
        address: form.address || null,
        phone: form.phone || null,
        is_main: branches.length === 0,
        is_active: true,
      })
      if (error) toast.error('Error al crear sucursal')
      else { toast.success('Sucursal creada'); setOpen(false); await loadBranches(orgId) }
    }
    setSaving(false)
  }

  async function toggleActive(b: Branch) {
    if (b.is_main) { toast.error('No podés desactivar la sucursal principal'); return }
    const supabase = createClient()
    await supabase.from('branches').update({ is_active: !b.is_active }).eq('id', b.id)
    await loadBranches(orgId)
  }

  const isOwner = myRole === 'owner'

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Sucursales</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Gestioná los puntos de venta de tu negocio</p>
        </div>
        {isOwner && (
          <Button onClick={openNew} className="gap-2 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            <Plus className="h-4 w-4" />Nueva sucursal
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[14px] font-semibold">Sucursales</h2>
          <span className="ml-auto text-[12px] text-muted-foreground">{branches.length}</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {fetching
            ? Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-40 rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-3 w-28 rounded bg-white/[0.05] animate-pulse" />
                </div>
              </div>
            ))
            : branches.map(b => (
              <div key={b.id} className="px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-medium">{b.name}</p>
                    {b.is_main && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                        Principal
                      </span>
                    )}
                    {!b.is_active && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                        Inactiva
                      </span>
                    )}
                  </div>
                  {b.address && <p className="text-[12px] text-muted-foreground truncate">{b.address}</p>}
                  {b.phone && <p className="text-[12px] text-muted-foreground">{b.phone}</p>}
                </div>
                {isOwner && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"
                      onClick={() => openEdit(b)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {!b.is_main && (
                      <Button variant="ghost" size="icon"
                        className={`h-8 w-8 ${b.is_active ? 'text-red-400 hover:bg-red-500/10' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
                        onClick={() => toggleActive(b)}>
                        {b.is_active ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar sucursal' : 'Nueva sucursal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {(['name', 'address', 'phone'] as const).map(field => (
              <div key={field} className="space-y-1.5">
                <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                  {field === 'name' ? 'Nombre *' : field === 'address' ? 'Dirección' : 'Teléfono'}
                </Label>
                <Input value={form[field] ?? ''} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  className="h-10 bg-white/[0.04] border-white/[0.08] rounded-xl" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1 rounded-xl text-white" disabled={saving} onClick={handleSave}
                style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
