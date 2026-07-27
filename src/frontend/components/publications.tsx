'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, X, ChevronLeft, ChevronRight, Languages } from 'lucide-react';
import { API_URL, getFileUrl } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/** Les descriptions ztfbooks contiennent du HTML : on n'affiche que le texte. */
function stripHtml(s: string): string {
  return (s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#?[a-z0-9]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Category { id: string; slug: string; name: string; }
interface Book {
  id: string; title: string; author: string | null; description: string;
  cover: string | null; file: string | null; preview: string | null;
  externalLink: string | null; featured?: boolean; categories?: Category[];
  source?: string | null; language?: string | null;
  languageCode?: string | null; priceLabel?: string | null;
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
              {/* Fond flou : remplit toute la bande quelle que soit la forme
                  de l'image, sans etirement visible. */}
              <img
                src={getFileUrl(s.image)} alt="" aria-hidden
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
              />
              {/* Image nette, entiere, jamais deformee ni rognee (contain). */}
              <img
                src={getFileUrl(s.image)} alt=""
                className="absolute inset-0 h-full w-full object-contain"
              />
              {/* Voile leger d'ensemble + halo sombre au centre, la ou vit le
                  texte : lisibilite sans noircir l'image. */}
              <div className="absolute inset-0 bg-black/30" />
              <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 70%)' }}
              />
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
                  <Eye className="h-4 w-4" />{s.kind === 'tract' ? t('books.viewTract') : t('books.detail.viewBook')}
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
  const [activeLang, setActiveLang] = useState('__all__');
  const [booksShown, setBooksShown] = useState(24);

  useEffect(() => {
    (async () => {
      // Promise.allSettled et non Promise.all : une ressource indisponible
      // (categories absentes d'un backend plus ancien, par exemple) ne doit
      // pas vider toute la page. Chaque bloc se charge independamment.
      const get = async (path: string) => {
        const r = await fetch(`${API_URL}/api/${path}?lang=${language}`);
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        const d = await r.json();
        return Array.isArray(d) ? d : [];
      };

      const [b, tr, c] = await Promise.allSettled([
        get('books'), get('tracts'), get('categories')
      ]);

      if (b.status === 'fulfilled') setBooks(b.value);
      else console.error('Publications, livres :', b.reason);

      if (tr.status === 'fulfilled') setTracts(tr.value);
      else console.error('Publications, tracts :', tr.reason);

      // Sans categories, les filtres disparaissent mais le catalogue reste
      if (c.status === 'fulfilled') setCategories(c.value);
      else console.error('Publications, categories :', c.reason);

      setLoading(false);
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
  const shownBooks = books.filter(
    (b) => matches(b) && (activeLang === '__all__' || (b.languageCode || b.language) === activeLang)
  );
  // Langues presentes, pour le filtre. Cle stable (code sinon nom).
  const langMap = new Map<string, string>();
  for (const b of books) {
    const key = b.languageCode || b.language;
    if (key && b.language) langMap.set(key, b.language);
  }
  const languages = Array.from(langMap.entries())
    .sort((a, b) => a[1].localeCompare(b[1]));

  // Mise en avant des livres selon la langue du site : on privilegie les
  // ouvrages dans la langue courante, avec repli sur l'ensemble si aucun.
  const featuredBooksAll = shownBooks.filter((b) => b.featured !== false);
  const featuredBooksInLang = featuredBooksAll.filter((b) => (b.languageCode || '') === language);
  const featuredBooks = featuredBooksInLang.length > 0 ? featuredBooksInLang : featuredBooksAll;

  const featured: Slide[] = [
    ...shownTracts.filter((tr) => tr.featured !== false).map((tr) => ({
      key: `t-${tr.id}`, kind: 'tract' as const,
      title: tr.title,
      subtitle: `${tr.languageCount} ${t('books.languages')}`,
      description: stripHtml(tr.description),
      // Cascade : illustration televersee, sinon rien (le degrade prend le relais).
      // Les apercus ne sont pas exposes par la liste publique des tracts.
      image: tr.cover,
      file: null, preview: null,
      href: `/t/${tr.slug}`, book: null
    })),
    ...featuredBooks.map((b) => ({
      key: `b-${b.id}`, kind: 'book' as const,
      title: b.title,
      subtitle: b.author ? `${t('books.by')} ${b.author}` : null,
      description: stripHtml(b.description),
      image: b.cover,
      file: b.file, preview: b.preview,
      href: `/livres/${b.id}`, book: b
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

          {/* 53 categories : un menu deroulant plutot qu'un mur de pastilles.
              Le filtre langue reste en pastilles plus bas (moins nombreuses). */}
          {categories.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">
                {t('books.filterByCategory')}
              </label>
              <select
                value={activeCat}
                onChange={(e) => { setActiveCat(e.target.value); setBooksShown(24); }}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="__all__">{t('books.allCategories')}</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
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
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              <p className="mb-4 text-muted-foreground">{t('books.booksSubtitle')}</p>

              {/* Filtre par langue — sur code stable, jamais sur le libelle */}
              {languages.length > 1 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setActiveLang('__all__'); setBooksShown(24); }}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      activeLang === '__all__'
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    {t('books.allLanguages')}
                  </button>
                  {languages.map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => { setActiveLang(code!); setBooksShown(24); }}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        activeLang === code
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}

              {shownBooks.length === 0 ? (
                <p className="text-muted-foreground">
                  {activeCat === '__all__' && activeLang === '__all__' ? t('books.noBooks') : t('books.noMatch')}
                </p>
              ) : (
                <>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {shownBooks.slice(0, booksShown).map((b) => (
                    <Link
                      key={b.id}
                      href={`/livres/${b.id}`}
                      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-lg"
                    >
                      {b.cover && (
                        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                          <img
                            src={getFileUrl(b.cover)} alt={b.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {b.language && (
                            <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                              {b.language}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-3">
                        <h3 className="font-serif text-sm font-bold leading-tight text-primary line-clamp-2 group-hover:underline">{b.title}</h3>
                        {b.author && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {b.author}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                          {b.priceLabel && (
                            <span className="text-xs font-semibold text-primary">{b.priceLabel}</span>
                          )}
                          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent">
                            {t('books.detail.viewBook')}<ChevronRight className="h-3.5 w-3.5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                {shownBooks.length > booksShown && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setBooksShown((n) => n + 24)}
                      className="rounded-full border-2 border-primary px-6 py-2.5 font-medium text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      {t('books.seeMore')} ({shownBooks.length - booksShown})
                    </button>
                  </div>
                )}
                </>
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
