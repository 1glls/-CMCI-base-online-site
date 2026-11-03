import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
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
  const book = await fetchBook(id);
  if (!book) notFound();

  return (
    <>
      <Header />
      <main className="pt-24">
        <BookDetail book={book} />
      </main>
      <Footer />
    </>
  );
}
