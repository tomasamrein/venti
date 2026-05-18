'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw new Error('Credenciales inválidas')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Error de autenticación')

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

      if (!profile?.is_super_admin) {
        await supabase.auth.signOut()
        throw new Error('Sin acceso al panel de administración')
      }

      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/20 via-transparent to-transparent" />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40">
              <span className="text-white text-xl font-black">V</span>
            </div>
            <div className="text-center">
              <h1 className="text-lg font-bold text-zinc-100">Ventix Admin</h1>
              <p className="text-[12px] text-zinc-500 mt-0.5">Panel de super administración</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ventix.ar"
                required
                autoComplete="email"
                className="w-full h-11 px-4 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-[14px] focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/30 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-[12px] font-semibold text-zinc-400 uppercase tracking-wider">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-600 text-[14px] focus:outline-none focus:border-zinc-600 focus:ring-2 focus:ring-zinc-600/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-[13px] text-red-400 bg-red-950/30 border border-red-900/40 px-3.5 py-2.5 rounded-lg">
                <span className="mt-px shrink-0">⚠</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white rounded-xl font-semibold text-[14px] transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-6">Acceso restringido · Solo super administradores</p>
      </div>
    </div>
  )
}
