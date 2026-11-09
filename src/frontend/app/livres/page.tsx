import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { fetchApi, fetchSettings } from '@/lib/server-data';
import { HOME_PATH } from '@/lib/site';
import { Publications, type Book, type Category, type Tract } from '@/components/publications';

const DESCRIPTION =
  'Les ouvrages et tracts de la Communauté Missionnaire Chrétienne Internationale en Belgique, à lire, télécharger et partager.';

export const metadata: Metadata = {
  title: 'Livre & littérature — CMCI Belgique',
  description: DESCRIPTION,
  alternates: { canonical: '/livres' },
  openGraph: {
    title: 'Livre & littérature — CMCI Belgique',
    description: DESCRIPTION,
    url: '/livres',
    siteName: 'CMCI Belgique',
    type: 'website',
    locale: 'fr_BE',
    images: ['/cmci-logo.png'],
  },
};

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export default async function LivresPage() {
  // Catalogue charge cote serveur : le HTML envoye a Google contient ainsi
  // les liens vers chaque fiche (avant : page vide, fiches « orphelines »).
  const [settings, books, tracts, categories] = await Promise.all([
    fetchSettings(),
    fetchApi<Book[]>('/api/books?lang=fr', [], 600),
    fetchApi<Tract[]>('/api/tracts?lang=fr', [], 600),
    fetchApi<Category[]>('/api/categories?lang=fr', [], 600),
  ]);
  const bookList = arr<Book>(books);

  // Index A–Z groupe par langue, replie par defaut.
  const byLang = new Map<string, Book[]>();
  for (const b of bookList) {
    const key = b.language || 'Autres';
    if (!byLang.has(key)) byLang.set(key, []);
    byLang.get(key)!.push(b);
  }
  const groups = Array.from(byLang.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([lang, list]) => [lang, list.sort((x, y) => x.title.localeCompare(y.title, 'fr'))] as const);

  return (
    <div className="grain-page bg-nuit">
      <SiteHeader home={HOME_PATH} />
      <Publications initialBooks={bookList} initialTracts={arr<Tract>(tracts)} initialCategories={arr<Category>(categories)} />

      {bookList.length > 0 && (
        <section className="mx-auto -mt-12 max-w-7xl px-6 pb-24 text-ivoire">
          <details className="group border-t border-or/20 pt-6">
            <summary className="cursor-pointer list-none font-caps text-xs uppercase tracking-[0.2em] text-or-clair/80 transition-colors hover:text-or-clair">
              Tous les titres ({bookList.length})
              <span className="ml-2 inline-block transition-transform group-open:rotate-90">›</span>
            </summary>
            <div className="mt-6 space-y-8">
              {groups.map(([lang, list]) => (
                <div key={lang}>
                  <h3 className="mb-3 font-display text-xl text-ivoire/90">{lang} <span className="text-sm text-ivoire/40">({list.length})</span></h3>
                  <ul className="columns-1 gap-8 text-sm sm:columns-2 lg:columns-3">
                    {list.map((b) => (
                      <li key={b.id} className="mb-1.5 break-inside-avoid">
                        <Link href={`/livres/${b.id}`} className="text-ivoire/60 transition-colors hover:text-or-clair">
                          {b.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        </section>
      )}

      <SiteFooter home={HOME_PATH} settings={settings} />
    </div>
  );
}
