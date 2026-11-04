'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rich } from '@/components/site/rich-text';
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
// Meme calcul cote serveur et cote navigateur (pas de DOM) : sinon les
// entites (&nbsp;, &amp;…) donnent deux textes differents et React signale
// une erreur d'hydratation.
const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", rsquo: '’', lsquo: '‘', laquo: '«', raquo: '»', hellip: '…' };
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/\s+/g, ' ')
    .trim();
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
    <div className="mx-auto max-w-6xl px-6 py-14 text-ivoire">
      <Link href="/livres" className="mb-10 inline-flex items-center font-caps text-[11px] uppercase tracking-[0.2em] text-ivoire/55 hover:text-or-clair">
        <ArrowLeft className="mr-1.5 h-4 w-4" />{t('books.detail.back')}
      </Link>

      <div className="grid gap-12 md:grid-cols-[minmax(0,300px)_1fr]">
        {/* Couverture */}
        <div>
          <div className="relative">
            <div aria-hidden className="absolute -inset-10 rounded-full bg-or/20 blur-3xl" />
            <div className="relative overflow-hidden bg-charbon shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] ring-1 ring-ivoire/10">
            {book.cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getFileUrl(book.cover)} alt={book.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center text-or/40">
                <BookOpen className="h-16 w-16" />
              </div>
            )}
            </div>
          </div>

          <button
            onClick={toggleLike}
            disabled={busy}
            className={`mt-6 flex w-full items-center justify-center gap-2 border px-4 py-3 text-sm font-medium transition
              ${liked ? 'border-rouge bg-rouge/15 text-rouge' : 'border-ivoire/25 text-ivoire/75 hover:border-rouge hover:text-rouge'}`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-rouge text-rouge' : ''}`} />
            {liked ? t('books.detail.liked') : t('books.detail.like')}
            <span className="tabular-nums text-ivoire/45">· {likes}</span>
          </button>
        </div>

        {/* Infos */}
        <div>
          <h1 className="font-display text-4xl font-medium leading-tight md:text-5xl"><Rich text={book.title} /></h1>
          {book.author && <p className="mt-3 font-display text-xl italic text-or-clair">{t('books.by')} {book.author}</p>}

          {/* Badges langue + langues soeurs */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {book.language && (
              <span className="inline-flex items-center border border-or/50 px-3 py-1 text-xs font-medium text-or-clair">
                {book.language}
              </span>
            )}
            {book.siblings.length > 0 && (
              <span className="text-xs text-ivoire/55">
                {t('books.detail.availableIn')} :{' '}
                {book.siblings.map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ' · '}
                    <Link href={`/livres/${s.id}`} className="font-medium text-or-clair hover:underline">
                      {s.language}
                    </Link>
                  </span>
                ))}
              </span>
            )}
          </div>

          {/* Meta */}
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ivoire/65">
            {book.pages != null && (
              <span className="inline-flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-or" />{book.pages} {t('books.detail.pages')}</span>
            )}
            {book.readMinutes != null && book.readMinutes > 0 && (
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-or" />{book.readMinutes} {t('books.detail.readTime')}</span>
            )}
            {book.publisherName && (
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-or" />{book.publisherName}</span>
            )}
          </div>

          {book.categories.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-or" />
              {book.categories.map((c) => (
                <span key={c.id} className="border-b border-or/40 px-1 text-xs text-ivoire/70">{c.name}</span>
              ))}
            </div>
          )}

          {description && (
            <p className="mt-8 whitespace-pre-line text-lg leading-relaxed text-ivoire/80"><Rich text={description} /></p>
          )}

          {/* Prix */}
          {book.priceLabel && (
            <p className="mt-8 font-display text-3xl text-or-clair">{book.priceLabel}</p>
          )}

          {/* CTA ztfbooks — apres la presentation */}
          {book.externalLink && (
            <a
              href={book.externalLink} target="_blank" rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 bg-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-nuit transition hover:bg-or-clair"
            >
              <ExternalLink className="h-4 w-4" />{t('books.detail.downloadOnZtf')}
            </a>
          )}

          {/* Version physique en Belgique */}
          <div className="mt-12 border-l-2 border-rouge pl-6">
            <h2 className="flex items-center gap-2 font-display text-2xl">
              <Mail className="h-5 w-5 text-or" />{t('books.detail.physicalCopyTitle')}
            </h2>
            <p className="mt-2 text-sm text-ivoire/65">{t('books.detail.physicalCopyText')}</p>
            <Link
              href="/mieux-nous-connaitre#contact"
              className="mt-4 inline-flex items-center gap-1.5 border border-or/50 px-5 py-2.5 font-caps text-[11px] uppercase tracking-[0.2em] text-or-clair hover:bg-or hover:text-nuit"
            >
              {t('books.detail.contactUs')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
