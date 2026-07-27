'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Heart, BookOpen, Clock, Tag, Building2, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { API_URL, getFileUrl } from '@/lib/api';

interface Category { id: string; slug?: string; name: string; }
interface Sibling { id: string; language: string | null; languageCode: string | null; externalLink: string | null; }
export interface BookDetailData {
  id: string; title: string; author: string | null; description: string;
  cover: string | null; externalLink: string | null;
  language: string | null; languageCode: string | null;
  priceLabel: string | null; discountPercentage: number | null;
  pages: number | null; readMinutes: number | null; publisherName: string | null;
  likes: number; categories: Category[]; siblings: Sibling[];
}

// Les descriptions ztfbooks contiennent du HTML : on ne rend que le texte.
function stripHtml(html: string): string {
  if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const el = document.createElement('div');
  el.innerHTML = html;
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

export function BookDetail({ book }: { book: BookDetailData }) {
  const { t } = useLanguage();
  const [likes, setLikes] = useState(book.likes);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  // Compteur de vue : une fois par session, jamais au prefetch.
  useEffect(() => {
    const key = `viewed:${book.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    fetch(`${API_URL}/api/books/${book.id}/view`, { method: 'POST' }).catch(() => {});
  }, [book.id]);

  // Etat « aime » persiste dans le navigateur (pas de compte utilisateur).
  useEffect(() => {
    try {
      const set: string[] = JSON.parse(localStorage.getItem('likedBooks') || '[]');
      setLiked(set.includes(book.id));
    } catch { /* ignore */ }
  }, [book.id]);

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    try {
      const res = await fetch(`${API_URL}/api/books/${book.id}/${next ? 'like' : 'unlike'}`, { method: 'POST' });
      const data = await res.json();
      if (typeof data.likes === 'number') setLikes(data.likes);
      setLiked(next);
      const set: string[] = JSON.parse(localStorage.getItem('likedBooks') || '[]');
      const updated = next ? [...new Set([...set, book.id])] : set.filter((x) => x !== book.id);
      localStorage.setItem('likedBooks', JSON.stringify(updated));
    } catch { /* silencieux */ } finally { setBusy(false); }
  };

  const description = book.description ? stripHtml(book.description) : '';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/livres" className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-primary">
        <ArrowLeft className="mr-1.5 h-4 w-4" />{t('books.detail.back')}
      </Link>

      <div className="grid gap-8 md:grid-cols-[minmax(0,260px)_1fr]">
        {/* Couverture */}
        <div>
          <div className="overflow-hidden rounded-xl border bg-gray-50 shadow-sm">
            {book.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getFileUrl(book.cover)} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center text-gray-300">
                <BookOpen className="h-16 w-16" />
              </div>
            )}
          </div>

          <button
            onClick={toggleLike}
            disabled={busy}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition
              ${liked ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            {liked ? t('books.detail.liked') : t('books.detail.like')}
            <span className="tabular-nums text-gray-400">· {likes}</span>
          </button>
        </div>

        {/* Infos */}
        <div>
          <h1 className="text-3xl font-bold leading-tight">{book.title}</h1>
          {book.author && <p className="mt-1 text-lg text-gray-600">{t('books.by')} {book.author}</p>}

          {/* Badges langue + langues soeurs */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {book.language && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {book.language}
              </span>
            )}
            {book.siblings.length > 0 && (
              <span className="text-xs text-gray-500">
                {t('books.detail.availableIn')} :{' '}
                {book.siblings.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ' · '}
                    <Link href={`/livres/${s.id}`} className="font-medium text-primary hover:underline">
                      {s.language}
                    </Link>
                  </span>
                ))}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
            {book.pages != null && (
              <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-gray-400" />{book.pages} {t('books.detail.pages')}</span>
            )}
            {book.readMinutes != null && book.readMinutes > 0 && (
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-gray-400" />{book.readMinutes} {t('books.detail.readTime')}</span>
            )}
            {book.publisherName && (
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-gray-400" />{book.publisherName}</span>
            )}
          </div>

          {book.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              {book.categories.map((c) => (
                <span key={c.id} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{c.name}</span>
              ))}
            </div>
          )}

          {description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-gray-700">{description}</p>
          )}

          {/* Prix */}
          {book.priceLabel && (
            <p className="mt-6 text-lg font-semibold text-gray-900">{book.priceLabel}</p>
          )}

          {/* CTA ztfbooks — apres la presentation */}
          {book.externalLink && (
            <a
              href={book.externalLink} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-medium text-white shadow-sm transition hover:bg-primary/90"
            >
              <ExternalLink className="h-4 w-4" />{t('books.detail.downloadOnZtf')}
            </a>
          )}

          {/* Version physique en Belgique */}
          <div className="mt-8 rounded-xl border border-accent/20 bg-accent/5 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Mail className="h-5 w-5 text-accent" />{t('books.detail.physicalCopyTitle')}
            </h2>
            <p className="mt-1.5 text-sm text-gray-600">{t('books.detail.physicalCopyText')}</p>
            <Link
              href="/#contact"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-accent/30 px-4 py-2 text-sm font-medium text-accent hover:bg-accent/10"
            >
              {t('books.detail.contactUs')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
