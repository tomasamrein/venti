import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/funcionalidades', '/precios', '/contacto', '/registro', '/login'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: 'https://ventix.com.ar/sitemap.xml',
  }
}
