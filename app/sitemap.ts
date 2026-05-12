import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://ventix.com.ar'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/funcionalidades`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/precios`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/registro`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terminos`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
