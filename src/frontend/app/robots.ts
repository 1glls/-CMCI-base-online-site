import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Back-office et banc d'essai du design : rien a indexer.
      disallow: ['/admin', '/preview'],
    },
    sitemap: 'https://www.cmcibelgique.org/sitemap.xml',
  }
}
