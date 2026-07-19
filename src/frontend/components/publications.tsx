'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, X, ChevronLeft, ChevronRight, Languages, ExternalLink } from 'lucide-react';
import { API_URL, getFileUrl } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Book {
  id: string; title: string; author: string | null; description: string;
  cover: string | null; file: string | null; preview: string | null;
  externalLink: string | null;
}
interface Tract {
  id: string; slug: string; title: string; description: string;
  cover: string | null; languageCount: number;
}

/* -------------------------------------------------------------------------
   Carrousel des ouvrages mis en avant.
   Defilement automatique, suspendu au survol et des qu'on prend la main :
   un contenu qui bouge pendant qu'on le lit est un contenu qu'on ne lit pas.
------------------------------------------------------------------------- */
function FeaturedCarousel({ books, onPreview }: { books: Book[]; onPreview: (b: Book) => void }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || books.length <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % books.length), 6000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, books.length]);

  if (books.length === 0) return null;

  const go = (d: number) => {
    setPaused(true);
    setIndex((i) => (i + d + books.length) % books.length);
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-primary text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {books.map((b) => (
          <div key={b.id} className="w-full shrink-0">
            <div className="grid items-center gap-6 p-6 sm:p-10 md:grid-cols-[auto_1fr]">
              <div className="mx-auto w-40 shrink-0 md:w-48">
                {b.cover ? (
                  <img
                    src={getFileUrl(b.cover)} alt={b.title}
                    className="w-full rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-white/10 text-sm text-white/60">
                    {b.title}
                  </div>
                )}
              </div>
              <div className="text-center md:text-start">
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                  {t('books.featured')}
                </span>
                <h3 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">{b.title}</h3>
                {b.author && (
                  <p className="mt-1 text-white/70">{t('books.by')} {b.author}</p>
                )}
                <p className="mt-3 line-clamp-3 text-white/85">{b.description}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
                  {(b.preview || b.file) && (
                    <button
                      onClick={() => onPreview(b)}
                      className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 font-semibold text-accent-foreground hover:bg-accent/90"
                    >
                      <Eye className="h-4 w-4" />{t('books.preview')}
                    </button>
                  )}
                  {b.file && (
                    <a
                      href={getFileUrl(b.file)} download
                      className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 font-semibold hover:bg-white/10"
                    >
                      <Download className="h-4 w-4" />{t('books.download')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {books.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute inset-inline-start-0 start-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 hover:bg-black/50"
            aria-label="Précédent"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-black/30 p-2 hover:bg-black/50"
            aria-label="Suivant"
          >
            <ChevronRight size={20} />
          </button>
          <div className="flex justify-center gap-2 pb-4">
            {books.map((_, i) => (
              <button
                key={i}
                onClick={() => { setPaused(true); setIndex(i); }}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-accent' : 'w-2 bg-white/40'}`}
                aria-label={`${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- */

export function Publications() {
  const { t, language } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewed, setPreviewed] = useState<Book | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [b, tr] = await Promise.all([
          fetch(`${API_URL}/api/books?lang=${language}`).then((r) => r.json()),
          fetch(`${API_URL}/api/tracts?lang=${language}`).then((r) => r.json())
        ]);
        if (Array.isArray(b)) setBooks(b);
        if (Array.isArray(tr)) setTracts(tr);
      } catch (e) {
        console.error('Publications:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [language]);

  const previewSrc = previewed
    ? getFileUrl(previewed.preview || previewed.file)
    : null;

  return (
    <main className="min-h-screen bg-background pt-24">
      <div className="container mx-auto px-4 pb-20">

        <header className="mb-10 text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            {t('books.label')}
          </span>
          <h1 className="mt-3 font-serif text-3xl font-bold text-primary md:text-4xl">
            {t('books.title')}
          </h1>
          <div className="mx-auto mt-4 h-1 w-20 bg-accent" />
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t('books.subtitle')}
          </p>
        </header>

        {loading && <p className="text-center text-muted-foreground">{t('books.loading')}</p>}

        {!loading && (
          <>
            {/* Ouvrages mis en avant */}
            {books.length > 0 && (
              <section className="mb-16">
                <FeaturedCarousel books={books.slice(0, 5)} onPreview={setPreviewed} />
              </section>
            )}

            {/* Tracts */}
            <section className="mb-16">
              <h2 className="font-serif text-2xl font-bold text-primary">
                {t('books.tractsTitle')}
              </h2>
              <p className="mb-6 text-muted-foreground">{t('books.tractsSubtitle')}</p>

              {tracts.length === 0 ? (
                <p className="text-muted-foreground">{t('books.noTracts')}</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {tracts.map((tr) => (
                    <Link
                      key={tr.id} href={`/t/${tr.slug}`}
                      className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
                    >
                      {tr.cover && (
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={getFileUrl(tr.cover)} alt={tr.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-5">
                        <h3 className="font-serif text-lg font-bold text-primary group-hover:text-accent">
                          {tr.title}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {tr.description}
                        </p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Languages className="h-4 w-4" />
                            {tr.languageCount} {t('books.languages')}
                          </span>
                          <span className="font-medium text-accent">{t('books.viewTract')} →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Livres */}
            <section>
              <h2 className="font-serif text-2xl font-bold text-primary">
                {t('books.booksTitle')}
              </h2>
              <p className="mb-6 text-muted-foreground">{t('books.booksSubtitle')}</p>

              {books.length === 0 ? (
                <p className="text-muted-foreground">{t('books.noBooks')}</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {books.map((b) => (
                    <article
                      key={b.id}
                      className="flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
                    >
                      {b.cover && (
                        <div className="aspect-[3/4] overflow-hidden bg-secondary">
                          <img
                            src={getFileUrl(b.cover)} alt={b.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        <h3 className="font-serif text-lg font-bold text-primary">{b.title}</h3>
                        {b.author && (
                          <p className="text-sm text-muted-foreground">
                            {t('books.by')} {b.author}
                          </p>
                        )}
                        <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                          {b.description}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(b.preview || b.file) && (
                            <button
                              onClick={() => setPreviewed(b)}
                              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/70"
                            >
                              <Eye className="h-4 w-4" />{t('books.preview')}
                            </button>
                          )}
                          {b.file && (
                            <a
                              href={getFileUrl(b.file)} download
                              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:bg-accent/90"
                            >
                              <Download className="h-4 w-4" />{t('books.download')}
                            </a>
                          )}
                          {b.externalLink && (
                            <a
                              href={b.externalLink} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm hover:bg-secondary"
                            >
                              <ExternalLink className="h-4 w-4" />{t('books.read')}
                            </a>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Previsualisation — contexte majoritairement desktop ici, contrairement
          a la page tract dont l'entree principale est un QR scanne au telephone. */}
      {previewed && previewSrc && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
          <div className="mb-3 flex items-center justify-between text-white">
            <span className="font-medium">{previewed.title}</span>
            <button
              onClick={() => setPreviewed(null)}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-white/20"
            >
              <X size={20} />{t('books.close')}
            </button>
          </div>
          <iframe
            src={previewSrc}
            className="w-full flex-1 rounded-lg bg-white"
            title={previewed.title}
          />
        </div>
      )}
    </main>
  );
}
