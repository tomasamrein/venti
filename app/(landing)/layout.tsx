import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: { default: 'Ventix — Software para negocios argentinos', template: '%s | Ventix' },
  description: 'Software de gestión pensado para kioscos, almacenes y comercios minoristas de Argentina.',
  openGraph: {
    siteName: 'Ventix',
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
    <div className="min-h-screen bg-white text-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
              <Image src="/isotipo.png" alt="Ventix" width={28} height={28} className="h-7 w-7 object-contain" priority />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Ventix</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login"
              className="hidden sm:inline text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Ingresar
            </Link>
            <Link
              href="/registro"
              className="inline-flex items-center h-8 px-4 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              Probar gratis
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="shrink-0 px-3 py-1 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
              {l.label}
            </Link>
          ))}
          <Link href="/login"
            className="shrink-0 px-3 py-1 rounded-lg text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors ml-auto">
            Ingresar
          </Link>
        </div>
      </header>

      <main className="pt-14 md:pt-14">{children}</main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                <Image src="/isotipo.png" alt="Ventix" width={24} height={24} className="h-6 w-6 object-contain" />
              </div>
                <span className="text-sm font-bold text-slate-700 tracking-tight">Ventix</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                POS y CRM para kioscos, almacenes y comercios argentinos. Con facturación ARCA y modo offline.
              </p>
              <a
                href="mailto:contacto@ventix.com.ar"
                className="inline-flex items-center gap-1.5 mt-4 text-xs text-emerald-600 hover:text-emerald-700 transition-colors font-medium"
              >
                <Mail className="h-3.5 w-3.5" />
                Consultar por correo
              </a>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Producto</p>
              <div className="space-y-2">
                {[
                  { href: '/funcionalidades', label: 'Funcionalidades' },
                  { href: '/precios', label: 'Precios' },
                  { href: '/#precios', label: 'Planes' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="block text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Soporte</p>
              <div className="space-y-2">
                {[
                  { href: '/contacto', label: 'Contacto' },
                  { href: '/contacto', label: 'WhatsApp' },
                ].map((l, i) => (
                  <Link key={i} href={l.href}
                    className="block text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Cuenta</p>
              <div className="space-y-2">
                {[
                  { href: '/registro', label: 'Crear cuenta gratis' },
                  { href: '/login', label: 'Ingresar' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="block text-sm text-slate-500 hover:text-slate-800 transition-colors">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">© 2026 Ventix. Hecho en Argentina. Por Tomás Amrein.</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Pagos con</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-white" style={{ background: '#009ee3' }}>
                MP
              </span>
              <span className="text-xs text-slate-300">·</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold text-white" style={{ background: '#1a56a4' }}>
                ARCA
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
