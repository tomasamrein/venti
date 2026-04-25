import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: { default: 'Venti — POS y CRM para negocios argentinos', template: '%s | Venti' },
  description: 'Sistema de punto de venta y CRM pensado para kioscos, almacenes y comercios minoristas de Argentina.',
  openGraph: {
    siteName: 'Venti',
    locale: 'es_AR',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070910] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#070910]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-black">V</span>
            </div>
            <span className="text-[15px] font-bold text-white">Venti</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/funcionalidades" className="text-[13px] text-[#8891a8] hover:text-white transition-colors">Funcionalidades</Link>
            <Link href="/precios" className="text-[13px] text-[#8891a8] hover:text-white transition-colors">Precios</Link>
            <Link href="/contacto" className="text-[13px] text-[#8891a8] hover:text-white transition-colors">Contacto</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-medium text-[#8891a8] hover:text-white transition-colors">Ingresar</Link>
            <Link
              href="/registro"
              className="inline-flex items-center h-8 px-4 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, oklch(0.55 0.22 160), oklch(0.50 0.24 145))' }}
            >
              Probar gratis
            </Link>
          </div>
        </div>
      </header>
      <main className="pt-14">{children}</main>
      <footer className="border-t border-white/[0.06] mt-20">
        <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
              <span className="text-white text-[10px] font-black">V</span>
            </div>
            <span className="text-[13px] font-semibold text-white">Venti</span>
            <span className="text-[12px] text-[#5a6480]">© 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/precios" className="text-[12px] text-[#5a6480] hover:text-white transition-colors">Precios</Link>
            <Link href="/contacto" className="text-[12px] text-[#5a6480] hover:text-white transition-colors">Contacto</Link>
            <Link href="/login" className="text-[12px] text-[#5a6480] hover:text-white transition-colors">Acceder</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
