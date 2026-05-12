import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  themeColor: '#0c0e14',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: { default: 'Ventix', template: '%s | Ventix' },
  description: 'Sistema de gestión para kioscos, almacenes y negocios argentinos',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ventix',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png',  sizes: '32x32',   type: 'image/png' },
      { url: '/favicon-64.png',  sizes: '64x64',   type: 'image/png' },
      { url: '/favicon.png',     sizes: '256x256',  type: 'image/png' },
      { url: '/favicon-192.png', sizes: '512x512',  type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-192.png', sizes: '256x256', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-background text-foreground antialiased font-sans">
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')` }} />
      </body>
    </html>
  )
}
