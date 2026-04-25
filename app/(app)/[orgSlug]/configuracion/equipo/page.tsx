'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Users, Plus, Trash2, Loader2, Mail, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface Member {
  id: string
  role: 'owner' | 'admin' | 'cashier'
  is_active: boolean
  joined_at: string | null
  profiles: { full_name: string | null; phone: string | null } | null
  user_id: string
}

const ROLE_LABELS = { owner: 'Dueño', admin: 'Admin', cashier: 'Cajero' }
const ROLE_COLORS = {
  owner: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  admin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  cashier: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
}

export default function EquipoPage() {
  const params = useParams()
  const orgSlug = params.orgSlug as string

  const [orgId, setOrgId] = useState('')
  const [myRole, setMyRole] = useState<string>('')
  const [myUserId, setMyUserId] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [fetching, setFetching] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'cashier'>('cashier')
  const [inviting, setInviting] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setMyUserId(user.id)

      const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
      if (!org) return
      setOrgId(org.id)

      const { data: me } = await supabase.from('organization_members')
        .select('role').eq('organization_id', org.id).eq('user_id', user.id).single()
      if (me) setMyRole(me.role)

      await loadMembers(org.id)
    }
    load()
  }, [orgSlug])

  async function loadMembers(oId: string) {
    setFetching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('organization_members')
      .select('id, role, is_active, joined_at, user_id, profiles(full_name, phone)')
      .eq('organization_id', oId)
      .order('joined_at', { ascending: true })
    setMembers((data ?? []) as unknown as Member[])
    setFetching(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) { toast.error('Ingresá un email'); return }
    setInviting(true)
    try {
      const supabase = createClient()
      // Try to find user by email via RPC
      const { data: authData } = await supabase.rpc('get_user_id_by_email' as never, { email: inviteEmail.trim().toLowerCase() } as never)
      const userId = authData as string | null

      if (!userId) {
        toast.error('No encontramos una cuenta con ese email. El usuario debe registrarse primero.')
        return
      }

      const { error } = await supabase.from('organization_members').insert({
        organization_id: orgId,
        user_id: userId,
        role: inviteRole,
        is_active: true,
        joined_at: new Date().toISOString(),
      })

      if (error?.code === '23505') { toast.error('Ese usuario ya es miembro'); return }
      if (error) { toast.error('Error al agregar miembro'); return }

      toast.success('Miembro agregado correctamente')
      setInviteOpen(false)
      setInviteEmail('')
      await loadMembers(orgId)
    } finally {
      setInviting(false)
    }
  }

  async function handleRoleChange(memberId: string, newRole: 'admin' | 'cashier') {
    const supabase = createClient()
    const { error } = await supabase.from('organization_members')
      .update({ role: newRole }).eq('id', memberId)
    if (error) toast.error('Error al cambiar rol')
    else { toast.success('Rol actualizado'); await loadMembers(orgId) }
  }

  async function handleRemove(memberId: string) {
    setRemoving(memberId)
    const supabase = createClient()
    const { error } = await supabase.from('organization_members')
      .update({ is_active: false }).eq('id', memberId)
    if (error) toast.error('Error al eliminar miembro')
    else { toast.success('Miembro desactivado'); await loadMembers(orgId) }
    setRemoving(null)
  }

  const canManage = myRole === 'owner' || myRole === 'admin'

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.03em]">Equipo</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Gestioná los miembros de tu negocio</p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)}
            className="gap-2 rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
            <Plus className="h-4 w-4" />
            Agregar miembro
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card card-shadow overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05] flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-[14px] font-semibold">Miembros activos</h2>
          <span className="ml-auto text-[12px] text-muted-foreground">{members.filter(m => m.is_active).length} miembros</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {fetching
            ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/[0.05] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 rounded bg-white/[0.05] animate-pulse" />
                  <div className="h-3 w-20 rounded bg-white/[0.05] animate-pulse" />
                </div>
              </div>
            ))
            : members.filter(m => m.is_active).map(member => (
              <div key={member.id} className="px-5 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <span className="text-[13px] font-bold text-violet-400">
                    {(member.profiles?.full_name ?? '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium truncate">
                    {member.profiles?.full_name ?? 'Sin nombre'}
                  </p>
                  {member.profiles?.phone && (
                    <p className="text-[12px] text-muted-foreground">{member.profiles.phone}</p>
                  )}
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[member.role]}`}>
                  {ROLE_LABELS[member.role]}
                </span>
                {canManage && member.role !== 'owner' && member.user_id !== myUserId && (
                  <div className="flex items-center gap-2">
                    <Select value={member.role} onValueChange={v => handleRoleChange(member.id, v as 'admin' | 'cashier')}>
                      <SelectTrigger className="h-8 w-28 text-[12px] rounded-lg bg-white/[0.04] border-white/[0.08]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="cashier">Cajero</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon"
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      disabled={removing === member.id}
                      onClick={() => handleRemove(member.id)}>
                      {removing === member.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card/50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-[13px] text-muted-foreground space-y-1">
            <p><span className="text-white font-medium">Dueño:</span> acceso total, puede configurar facturación y suscripción.</p>
            <p><span className="text-white font-medium">Admin:</span> puede gestionar productos, clientes y ver reportes.</p>
            <p><span className="text-white font-medium">Cajero:</span> solo puede usar el POS y emitir facturas.</p>
          </div>
        </div>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar miembro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
                Email del usuario
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="usuario@email.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="pl-9 h-10 bg-white/[0.04] border-white/[0.08] rounded-xl"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">El usuario debe tener una cuenta en Venti.</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">Rol</Label>
              <Select value={inviteRole} onValueChange={v => setInviteRole(v as 'admin' | 'cashier')}>
                <SelectTrigger className="h-10 rounded-xl bg-white/[0.04] border-white/[0.08]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cajero</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setInviteOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-xl text-white" disabled={inviting} onClick={handleInvite}
                style={{ background: 'linear-gradient(135deg, oklch(0.60 0.26 278), oklch(0.55 0.28 295))' }}>
                {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
