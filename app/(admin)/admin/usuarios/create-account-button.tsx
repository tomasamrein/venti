'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserPlus, Loader2 } from 'lucide-react'
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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const inputCls = "w-full h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/40"
const labelCls = "block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5"

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
      toast.success(`Cuenta creada: ${form.email}`)
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
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors shrink-0"
      >
        <UserPlus className="h-4 w-4" />
        Crear cuenta
      </button>

      <Dialog open={open} onOpenChange={v => !v && !loading && setOpen(false)}>
        <DialogContent className="max-w-md max-h-[90dvh] flex flex-col bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Crear cuenta para cliente</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto flex-1 pr-0.5">
            {/* Usuario */}
            <div className="space-y-3">
              <p className={labelCls}>Datos del usuario</p>
              <input
                className={inputCls}
                placeholder="Nombre completo"
                value={form.full_name}
                onChange={e => setField('full_name', e.target.value)}
                required
              />
              <input
                type="email"
                className={inputCls}
                placeholder="Email"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
                required
              />
              <input
                type="password"
                className={inputCls}
                placeholder="Contraseña (mín. 8 caracteres)"
                value={form.password}
                onChange={e => setField('password', e.target.value)}
                minLength={8}
                required
              />
            </div>

            {/* Negocio */}
            <div className="space-y-3">
              <p className={labelCls}>Negocio</p>
              <input
                className={inputCls}
                placeholder="Nombre del negocio"
                value={form.org_name}
                onChange={e => setField('org_name', e.target.value)}
                required
              />
              <div className="flex items-center gap-0">
                <span className="h-10 inline-flex items-center px-3 rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800/80 text-[12px] text-zinc-500 font-mono shrink-0">
                  ventix.ar/
                </span>
                <input
                  className="flex-1 h-10 px-3 rounded-r-lg bg-zinc-800 border border-zinc-700 text-[13px] text-zinc-100 font-mono placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/40"
                  placeholder="mi-negocio"
                  value={form.org_slug}
                  onChange={e => setField('org_slug', slugify(e.target.value))}
                  required
                />
              </div>
              <input
                className={inputCls}
                placeholder="Nombre de sucursal principal"
                value={form.branch_name}
                onChange={e => setField('branch_name', e.target.value)}
                required
              />
            </div>

            {/* Trial */}
            <div className="space-y-2">
              <p className={labelCls}>Trial</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.trial_days}
                  onChange={e => setField('trial_days', parseInt(e.target.value) || 14)}
                  className="w-20 h-10 px-3 rounded-lg bg-zinc-800 border border-zinc-700 text-[13px] text-zinc-100 focus:outline-none focus:border-zinc-600"
                />
                <span className="text-[13px] text-zinc-500">días de prueba</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1 pb-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1 h-10 rounded-lg text-[13px] font-medium text-zinc-400 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-10 rounded-lg text-[13px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Crear cuenta
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
