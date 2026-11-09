import type { MetadataRoute } from 'next'
import { fetchApi } from '@/lib/server-data'

const SITE = 'https://www.cmcibelgique.org'

// Le catalogue change (synchro ztfbooks, nouveaux tracts) : regenere toutes les heures.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [books, tracts] = await Promise.all([
    fetchApi<{ id: string }[]>('/api/books', [], 3600),
    fetchApi<{ slug: string }[]>('/api/tracts', [], 3600),
  ])

  return [
    { url: SITE, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE}/livres`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/mieux-nous-connaitre`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE}/temps-forts`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE}/galerie`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE}/confidentialite`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/conditions`, changeFrequency: 'yearly', priority: 0.3 },
    ...(Array.isArray(tracts) ? tracts : []).map((t) => ({
      url: `${SITE}/t/${encodeURIComponent(t.slug)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...(Array.isArray(books) ? books : []).map((b) => ({
      url: `${SITE}/livres/${encodeURIComponent(b.id)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
