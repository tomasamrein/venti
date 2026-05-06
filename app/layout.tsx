import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: { default: 'Ventix', template: '%s | Ventix' },
  description: 'Sistema de gestión para kioscos, almacenes y negocios argentinos',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/icon.png', sizes: '180x180' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-background text-foreground antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
