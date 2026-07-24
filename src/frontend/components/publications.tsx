'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, X, ChevronLeft, ChevronRight, Languages, ExternalLink } from 'lucide-react';
import { API_URL, getFileUrl } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface Category { id: string; slug: string; name: string; }
interface Book {
  id: string; title: string; author: string | null; description: string;
  cover: string | null; file: string | null; preview: string | null;
  externalLink: string | null; featured?: boolean; categories?: Category[];
}
interface Tract {
  id: string; slug: string; title: string; description: string;
  cover: string | null; languageCount: number; featured?: boolean;
  categories?: Category[];
}

/* -------------------------------------------------------------------------
   Carrousel des ouvrages mis en avant.
   Defilement automatique, suspendu au survol et des qu'on prend la main :
   un contenu qui bouge pendant qu'on le lit est un contenu qu'on ne lit pas.
------------------------------------------------------------------------- */
type Slide = {
  key: string; kind: 'book' | 'tract';
  title: string; subtitle: string | null; description: string;
  image: string | null;   // illustration, ou premier apercu, ou null -> degrade
  file: string | null; preview: string | null;
  href: string | null; book: Book | null;
};

function FeaturedCarousel({ slides, onPreview }: { slides: Slide[]; onPreview: (b: Book) => void }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, slides.length]);

  if (slides.length === 0) return null;

  const go = (d: number) => {
    setPaused(true);
    setIndex((i) => (i + d + slides.length) % slides.length);
  };

  return (
    <section
      className="relative h-[60vh] max-h-[560px] min-h-[420px] w-full overflow-hidden bg-primary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <div
          key={s.key}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            i === index ? "visible z-10 opacity-100" : "invisible z-0 opacity-0"
          )}
        >
          {s.image ? (
            <>
              <img src={getFileUrl(s.image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              {/* Voile plus dense que celui du hero : ces visuels sont clairs
                  et charges, la ou l'accueil pose son texte sur des photos
                  sombres. Applique uniquement sur une image : sur le degrade
                  de repli il ecraserait les couleurs de la marque jusqu'au noir. */}
              <div className="absolute inset-0 bg-black/55" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/30" />
            </>
          ) : (
            // Ni illustration ni apercu : degrade aux couleurs du site, pour
            // qu'une banderole ne soit jamais vide. Deja assez sombre pour
            // porter du texte blanc.
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-accent/50" />
          )}
        </div>
      ))}

      {/* Contenu */}
      <div className="relative z-20 flex h-full flex-col items-center justify-center px-6 text-center text-white">
        {slides.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "max-w-3xl transition-all duration-700",
              i === index ? "relative opacity-100" : "pointer-events-none absolute opacity-0"
            )}
            style={{ display: i === index ? 'block' : 'none' }}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              {s.kind === 'tract' ? t('books.tractsTitle') : t('books.featured')}
            </span>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
              {s.title}
            </h2>
            {s.subtitle && <p className="mt-2 text-white/80">{s.subtitle}</p>}
            <p className="mx-auto mt-4 max-w-2xl text-white/90 line-clamp-3">{s.description}</p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {s.href && (
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <Eye className="h-4 w-4" />{t('books.viewTract')}
                </Link>
              )}
              {s.book && (s.book.preview || s.book.file) && (
                <button
                  onClick={() => onPreview(s.book!)}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                >
                  <Eye className="h-4 w-4" />{t('books.preview')}
                </button>
              )}
              {s.file && (
                <a
                  href={getFileUrl(s.file)} download
                  className="inline-flex items-center gap-2 rounded-full border border-white/50 px-7 py-3 font-semibold transition-colors hover:bg-white/10"
                >
                  <Download className="h-4 w-4" />{t('books.download')}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/30 p-3 text-white transition-colors hover:bg-black/50 sm:block"
            aria-label="Précédent"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 rounded-full bg-black/30 p-3 text-white transition-colors hover:bg-black/50 sm:block"
            aria-label="Suivant"
          >
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-6 left-0 right-0 z-30 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => { setPaused(true); setIndex(i); }}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-7 bg-accent" : "w-2 bg-white/50 hover:bg-white/80"
                )}
                aria-label={`${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------------- */

export function Publications() {
  const { t, language } = useLanguage();
  const [books, setBooks] = useState<Book[]>([]);
  const [tracts, setTracts] = useState<Tract[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewed, setPreviewed] = useState<Book | null>(null);
  // Le filtre s'appuie sur le slug, jamais sur le libelle : celui-ci est
  // traduit, et le regroupement casserait au changement de langue.
  const [activeCat, setActiveCat] = useState('__all__');

  useEffect(() => {
    (async () => {
      try {
        const [b, tr, c] = await Promise.all([
          fetch(`${API_URL}/api/books?lang=${language}`).then((r) => r.json()),
          fetch(`${API_URL}/api/tracts?lang=${language}`).then((r) => r.json()),
          fetch(`${API_URL}/api/categories?lang=${language}`).then((r) => r.json())
        ]);
        if (Array.isArray(b)) setBooks(b);
        if (Array.isArray(tr)) setTracts(tr);
        if (Array.isArray(c)) setCategories(c);
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

  // Le carrousel met en avant l'ensemble des publications, tracts compris :
  // c'est le premier bloc de la page, comme le hero sur l'accueil.
  const matches = (item: { categories?: Category[] }) =>
    activeCat === '__all__' || (item.categories ?? []).some((c) => c.slug === activeCat);

  const shownTracts = tracts.filter(matches);
  const shownBooks = books.filter(matches);

  const featured: Slide[] = [
    ...shownTracts.filter((tr) => tr.featured !== false).map((tr) => ({
      key: `t-${tr.id}`, kind: 'tract' as const,
      title: tr.title,
      subtitle: `${tr.languageCount} ${t('books.languages')}`,
      description: tr.description,
      // Cascade : illustration televersee, sinon rien (le degrade prend le relais).
      // Les apercus ne sont pas exposes par la liste publique des tracts.
      image: tr.cover,
      file: null, preview: null,
      href: `/t/${tr.slug}`, book: null
    })),
    ...shownBooks.filter((b) => b.featured !== false).map((b) => ({
      key: `b-${b.id}`, kind: 'book' as const,
      title: b.title,
      subtitle: b.author ? `${t('books.by')} ${b.author}` : null,
      description: b.description,
      image: b.cover,
      file: b.file, preview: b.preview,
      href: null, book: b
    }))
  ].slice(0, 6);

  return (
    <main className="min-h-screen bg-background">
      {/* Banderole pleine largeur, hors du conteneur : elle doit toucher les
          bords de l'ecran comme le hero de l'accueil. */}
      {!loading && featured.length > 0 && (
        <FeaturedCarousel slides={featured} onPreview={setPreviewed} />
      )}

      <div className="container mx-auto px-4 pb-20 pt-12">

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

          {categories.length > 0 && (
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              {[{ id: '__all__', slug: '__all__', name: t('books.allCategories') }, ...categories]
                .map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => setActiveCat(c.slug)}
                    className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                      activeCat === c.slug
                        ? 'border-primary bg-primary text-primary-foreground font-medium'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
            </div>
          )}
        </header>

        {loading && <p className="text-center text-muted-foreground">{t('books.loading')}</p>}

        {!loading && (
          <>
            {/* Ouvrages mis en avant */}
            {/* Tracts */}
            <section className="mb-16">
              <h2 className="font-serif text-2xl font-bold text-primary">
                {t('books.tractsTitle')}
              </h2>
              <p className="mb-6 text-muted-foreground">{t('books.tractsSubtitle')}</p>

              {shownTracts.length === 0 ? (
                <p className="text-muted-foreground">
                  {activeCat === '__all__' ? t('books.noTracts') : t('books.noMatch')}
                </p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {shownTracts.map((tr) => (
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

              {shownBooks.length === 0 ? (
                <p className="text-muted-foreground">
                  {activeCat === '__all__' ? t('books.noBooks') : t('books.noMatch')}
                </p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {shownBooks.map((b) => (
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
