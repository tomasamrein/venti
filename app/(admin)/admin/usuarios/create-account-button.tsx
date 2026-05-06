'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreateAccountButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    org_name: '',
    org_slug: '',
    branch_name: 'Local principal',
    trial_days: 14,
  })

  function setField(key: string, value: string | number) {
    setForm(prev => {
      const updated = { ...prev, [key]: value }
      if (key === 'org_name' && !prev.org_slug) {
        updated.org_slug = slugify(value as string)
      }
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error al crear la cuenta')
        setLoading(false)
        return
      }
      toast.success(`Cuenta creada: ${form.email} → /${data.slug}`)
      setOpen(false)
      setForm({ full_name: '', email: '', password: '', org_name: '', org_slug: '', branch_name: 'Local principal', trial_days: 14 })
      router.refresh()
    } catch {
      toast.error('Error de conexión')
    }
    setLoading(false)
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
      >
        <UserPlus className="h-4 w-4" />
        Crear cuenta
      </Button>

      <Dialog open={open} onOpenChange={v => !v && !loading && setOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear cuenta para cliente</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Datos del usuario</Label>
              <Input
                placeholder="Nombre completo"
                value={form.full_name}
                onChange={e => setField('full_name', e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Contraseña (mín. 8 caracteres)"
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                minLength={8}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Negocio</Label>
              <Input
                placeholder="Nombre del negocio"
                value={form.org_name}
                onChange={e => setField('org_name', e.target.value)}
                required
              />
              <div className="flex items-center gap-0">
                <span className="h-9 inline-flex items-center px-2.5 rounded-l-md border border-r-0 border-border bg-muted text-xs text-muted-foreground font-mono">
                  ventix.ar/
                </span>
                <Input
                  className="rounded-l-none font-mono text-sm"
                  placeholder="mi-negocio"
                  value={form.org_slug}
                  onChange={e => setField('org_slug', slugify(e.target.value))}
                  required
                />
              </div>
              <Input
                placeholder="Nombre de sucursal principal"
                value={form.branch_name}
                onChange={e => setField('branch_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trial</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={form.trial_days}
                  onChange={e => setField('trial_days', parseInt(e.target.value) || 14)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">días de prueba</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
