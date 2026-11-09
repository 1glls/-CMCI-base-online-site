import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { fetchSettings } from '@/lib/server-data';
import { HOME_PATH } from '@/lib/site';
import { BookDetail, type BookDetailData } from '@/components/book-detail';
import { API_URL, getFileUrl } from '@/lib/api';

// Le catalogue evolue (synchro ztfbooks) : la fiche reflete l'etat courant.
export const dynamic = 'force-dynamic';

async function fetchBook(id: string): Promise<BookDetailData | null> {
  try {
    const res = await fetch(`${API_URL}/api/books/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await fetchBook(id);
  if (!book) return { title: 'Livre introuvable — CMCI Belgique' };
  return {
    title: `${book.title} — CMCI Belgique`,
    description: book.description ? book.description.replace(/<[^>]*>/g, ' ').slice(0, 160) : undefined,
    alternates: { canonical: `/livres/${id}` },
    openGraph: {
      title: book.title,
      url: `/livres/${id}`,
      siteName: 'CMCI Belgique',
      type: 'book',
      images: book.cover ? [getFileUrl(book.cover)] : undefined
    }
  };
}

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [book, settings] = await Promise.all([fetchBook(id), fetchSettings()]);
  if (!book) notFound();

  // Donnees structurees schema.org : aident Google a comprendre la fiche.
  const plain = book.description ? book.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title,
    url: `https://www.cmcibelgique.org/livres/${id}`,
    ...(book.author ? { author: { '@type': 'Person', name: book.author } } : {}),
    ...(book.languageCode ? { inLanguage: book.languageCode } : {}),
    ...(book.cover ? { image: getFileUrl(book.cover) } : {}),
    ...(plain ? { description: plain.slice(0, 500) } : {}),
    ...(book.pages ? { numberOfPages: book.pages } : {}),
    ...(book.publisherName ? { publisher: { '@type': 'Organization', name: book.publisherName } } : {}),
  };

  return (
    <div className="grain-page bg-nuit">
      <script
        type="application/ld+json"
        // « < » echappe : une description ne doit jamais pouvoir fermer la balise script.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <SiteHeader home={HOME_PATH} />
      <main className="pt-36">
        <BookDetail book={book} />
      </main>
      <SiteFooter home={HOME_PATH} settings={settings} />
    </div>
  );
}
