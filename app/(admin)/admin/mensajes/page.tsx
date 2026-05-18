'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Send, Megaphone, Building2, Users } from 'lucide-react'

export default function MensajesPage() {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [lastSent, setLastSent] = useState<{ count: number; time: string } | null>(null)

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error('Completá el título y el mensaje')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/admin/send-announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar')
      toast.success(`Mensaje enviado a ${data.sent} organización${data.sent !== 1 ? 'es' : ''}`)
      setLastSent({ count: data.sent, time: new Date().toLocaleTimeString('es-AR') })
      setTitle('')
      setBody('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSending(false)
    }
  }

  const inputCls = "w-full px-3 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-[13px] text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/40 resize-none"

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-red-400" />
          Mensajes globales
        </h1>
        <p className="text-[13px] text-zinc-500 mt-1">
          Enviá anuncios a todos los usuarios. Aparecen en el centro de notificaciones.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Destinatarios</p>
            <p className="text-[12px] font-semibold text-zinc-200">Todas las orgs activas</p>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-[11px] text-zinc-500">Tipo</p>
            <p className="text-[12px] font-semibold text-zinc-200">Anuncio del sistema</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
        <div>
          <p className="text-[14px] font-semibold text-zinc-100">Nuevo anuncio</p>
          <p className="text-[12px] text-zinc-500 mt-0.5">Aparecerá en la campana de cada usuario.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Título</label>
          <input
            type="text"
            className={inputCls}
            placeholder="Ej: Actualización del sistema disponible"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Mensaje</label>
            <span className="text-[11px] text-zinc-600">{body.length}/500</span>
          </div>
          <textarea
            className={inputCls}
            placeholder="Describí los cambios, mejoras o novedades..."
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={500}
            rows={5}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full h-10 rounded-lg text-[13px] font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Send className="h-4 w-4" />
          {sending ? 'Enviando...' : 'Enviar a todas las organizaciones'}
        </button>
      </div>

      {lastSent && (
        <div className="flex items-center gap-2 text-[12px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg">
          <span className="inline-flex px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-medium border border-zinc-700">Último envío</span>
          {lastSent.time} — enviado a {lastSent.count} organización{lastSent.count !== 1 ? 'es' : ''}
        </div>
      )}
    </div>
  )
}
