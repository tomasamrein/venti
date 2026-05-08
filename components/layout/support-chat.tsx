'use client'

import { useState, useRef, useEffect, useContext } from 'react'
import { X, Send, Loader2, Bot, User } from 'lucide-react'
import { OrgContext } from '@/components/providers/org-provider'

interface Message {
  role: 'user' | 'model'
  content: string
}

export function SupportChat() {
  const ctx = useContext(OrgContext)
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: '¡Hola! Soy el asistente de Ventix 👋 ¿En qué te puedo ayudar?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      inputRef.current?.focus()
    }
  }, [open, messages])

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10),
          orgId: ctx?.org.id,
          userName: ctx?.userFullName,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        console.error('[chat] API error:', data.error, res.status)
        setMessages(prev => [...prev, { role: 'model', content: 'Hubo un error al procesar tu consulta. Intentá de nuevo.' }])
      } else {
        setMessages(prev => [...prev, { role: 'model', content: data.reply || 'No pude generar una respuesta.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'Error de conexión. Intentá de nuevo.' }])
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {open && (
        <div className="w-80 h-[420px] flex flex-col rounded-2xl border border-border bg-card shadow-2xl shadow-black/10 dark:shadow-black/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-emerald-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="text-sm font-semibold">Soporte Ventix</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  m.role === 'model' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {m.role === 'model'
                    ? <Bot className="h-3.5 w-3.5 text-emerald-600" />
                    : <User className="h-3.5 w-3.5 text-slate-500" />
                  }
                </div>
                <div className={`max-w-[220px] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-600 text-white rounded-tr-sm'
                    : 'bg-muted text-foreground rounded-tl-sm'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <Bot className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 pb-3">
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                placeholder="Escribí tu consulta..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="text-emerald-600 disabled:opacity-40 hover:text-emerald-500 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip "¿Necesitás ayuda?" */}
      {!open && !dismissed && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="relative bg-card text-foreground text-sm font-medium px-3 py-2 rounded-xl shadow-md border border-border whitespace-nowrap">
            ¿Necesitás ayuda?
            {/* triangle */}
            <span className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-border" />
            <span className="absolute right-[-5px] top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-card" />
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow hover:bg-red-600 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            1
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => { setOpen(v => !v); setDismissed(true) }}
        className="relative w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Bot className="h-7 w-7" />
            {!dismissed && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">
                1
              </span>
            )}
          </>
        )}
      </button>
    </div>
  )
}
