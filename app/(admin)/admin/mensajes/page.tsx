'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Send, Megaphone, Users, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

  const charCount = body.length

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-red-500" />
          Mensajes globales
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enviá anuncios a todos los usuarios de la plataforma. Aparecen en el centro de notificaciones.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border p-4 flex items-center gap-3">
          <Building2 className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Destinatarios</p>
            <p className="text-sm font-semibold">Todas las organizaciones activas</p>
          </div>
        </div>
        <div className="rounded-xl border p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="text-sm font-semibold">Anuncio del sistema</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo anuncio</CardTitle>
          <CardDescription>
            El mensaje aparecerá en la campana de notificaciones de cada usuario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ej: Actualización del sistema disponible"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Mensaje</Label>
              <span className="text-xs text-muted-foreground">{charCount}/500</span>
            </div>
            <Textarea
              id="body"
              placeholder="Describí los cambios, mejoras o novedades..."
              value={body}
              onChange={e => setBody(e.target.value)}
              maxLength={500}
              rows={5}
            />
          </div>

          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Enviando...' : 'Enviar a todas las organizaciones'}
          </Button>
        </CardContent>
      </Card>

      {lastSent && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-3 rounded-lg">
          <Badge variant="secondary" className="text-xs">Último envío</Badge>
          {lastSent.time} — enviado a {lastSent.count} organización{lastSent.count !== 1 ? 'es' : ''}
        </div>
      )}
    </div>
  )
}
