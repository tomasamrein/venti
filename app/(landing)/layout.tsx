import type { Metadata } from 'next'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: { default: 'Venti — Software para negocios argentinos', template: '%s | Venti' },
  description: 'Software de gestión pensado para kioscos, almacenes y comercios minoristas de Argentina.',
  openGraph: {
    siteName: 'Venti',
    locale: 'es_AR',
  },
}

const NAV_LINKS = [
  { href: '/funcionalidades', label: 'Funcionalidades' },
  { href: '/precios', label: 'Precios' },
  { href: '/contacto', label: 'Contacto' },
]

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070910] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#070910]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-[11px] font-black">V</span>
            </div>
            <span className="text-[15px] font-bold text-white">Venti</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className="px-3 py-1.5 rounded-lg text-[13px] text-[#8891a8] hover:text-white hover:bg-white/[0.05] transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login"
              className="hidden sm:inline text-[13px] font-medium text-[#8891a8] hover:text-white transition-colors">
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center h-8 px-4 rounded-lg text-[13px] font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #4F46E5, #06B6D4)' }}
            >
              Probar gratis
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-white/[0.05] px-4 py-2 flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="shrink-0 px-3 py-1 rounded-lg text-[12px] text-[#8891a8] hover:text-white hover:bg-white/[0.05] transition-colors">
              {l.label}
            </Link>
          ))}
          <Link href="/login"
            className="shrink-0 px-3 py-1 rounded-lg text-[12px] text-[#8891a8] hover:text-white hover:bg-white/[0.05] transition-colors ml-auto">
            Ingresar
          </Link>
        </div>
      </header>

      <main className="pt-14 md:pt-14">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] mt-20">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white text-[11px] font-black">V</span>
                </div>
                <span className="text-[15px] font-bold text-white">Venti</span>
              </div>
              <p className="text-[12px] text-[#5a6480] leading-relaxed max-w-xs">
                POS y CRM para kioscos, almacenes y comercios argentinos. Con facturación ARCA y modo offline.
              </p>
              <a
                href="https://wa.me/5493437479134?text=Hola%2C%20quiero%20saber%20más%20sobre%20Venti"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Consultar por WhatsApp
              </a>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[#5a6480] uppercase tracking-wider mb-3">Producto</p>
              <div className="space-y-2">
                {[
                  { href: '/funcionalidades', label: 'Funcionalidades' },
                  { href: '/precios', label: 'Precios' },
                  { href: '/#precios', label: 'Planes' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="block text-[13px] text-[#5a6480] hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[#5a6480] uppercase tracking-wider mb-3">Soporte</p>
              <div className="space-y-2">
                {[
                  { href: '/contacto', label: 'Contacto' },
                  { href: '/contacto', label: 'WhatsApp' },
                ].map((l, i) => (
                  <Link key={i} href={l.href}
                    className="block text-[13px] text-[#5a6480] hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-[#5a6480] uppercase tracking-wider mb-3">Cuenta</p>
              <div className="space-y-2">
                {[
                  { href: '/registro', label: 'Crear cuenta gratis' },
                  { href: '/login', label: 'Ingresar' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="block text-[13px] text-[#5a6480] hover:text-white transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[12px] text-[#3d4560]">© 2026 Venti. Hecho en Argentina.</p>
            <div className="flex items-center gap-4">
              <span className="text-[11px] text-[#3d4560]">Pagos con</span>
              <span className="text-[12px] font-semibold text-[#5a6480]">Mercado Pago</span>
              <span className="text-[11px] text-[#3d4560]">·</span>
              <span className="text-[12px] font-semibold text-[#5a6480]">ARCA / AFIP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
