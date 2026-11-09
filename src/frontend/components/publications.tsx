'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Download, Eye, X, ChevronLeft, ChevronRight, Languages, Search } from 'lucide-react';
import { PRIMARY_LANGS } from '@/lib/book-categories';
import { CategoryFilter } from '@/components/category-filter';

/** Repli des accents pour une recherche insensible : « évangélisa » ⊂ « evangelisa ». */
const foldAccents = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
import { API_URL, getFileUrl } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTiming } from '@/components/site/timing-provider'
import { cn } from '@/lib/utils';
import { Rich } from '@/components/site/rich-text';
import { CmfiLink } from '@/components/site/cmfi-link';
import { CMFI } from '@/lib/cmfi';

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

export interface Category { id: string; slug: string; name: string; }
export interface Book {
  id: string; title: string; author: string | null; description: string;
  cover: string | null; file: string | null; preview: string | null;
  externalLink: string | null; featured?: boolean; categories?: Category[];
  source?: string | null; language?: string | null;
  languageCode?: string | null; priceLabel?: string | null;
  groupLanguages?: { code: string | null; name: string }[];
}
export interface Tract {
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
  const every = useTiming('timing_books_banner');

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timer.current = setInterval(() => setIndex((i) => (i + 1) % slides.length), every);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [paused, slides.length, every]);

  if (slides.length === 0) return null;

  const go = (d: number) => {
    setPaused(true);
    setIndex((i) => (i + d + slides.length) % slides.length);
  };

  return (
    <section
      className="relative h-[78vh] max-h-[720px] min-h-[540px] w-full overflow-hidden bg-nuit"
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
              <div className="absolute inset-0 bg-nuit/35" />
              <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(ellipse at center, color-mix(in srgb, var(--nuit) 60%, transparent) 0%, color-mix(in srgb, var(--nuit) 15%, transparent) 70%)' }}
              />
            </>
          ) : (
            // Ni illustration ni apercu : degrade aux couleurs du site, pour
            // qu'une banderole ne soit jamais vide. Deja assez sombre pour
            // porter du texte blanc.
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_45%,rgba(240,179,35,0.22),transparent_70%)]" />
          )}
        </div>
      ))}

      {/* Contenu */}
      {/* Fondu vers la page en bas de la banderole */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-nuit to-transparent" />
      <div className="relative z-20 flex h-full flex-col items-center justify-center px-6 pt-24 text-center text-ivoire">
        {slides.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "max-w-3xl transition-all duration-700",
              i === index ? "relative opacity-100" : "pointer-events-none absolute opacity-0"
            )}
            style={{ display: i === index ? 'block' : 'none' }}
          >
            <span className="eyebrow text-or-clair">
              {s.kind === 'tract' ? t('books.tractsTitle') : t('books.featured')}
            </span>
            <h2 className="mt-4 font-display text-4xl font-medium leading-tight sm:text-5xl md:text-6xl">
              <Rich text={s.title} />
            </h2>
            {s.subtitle && <p className="mt-2 text-ivoire/80">{s.subtitle}</p>}
            <p className="mx-auto mt-4 max-w-2xl text-ivoire/80 line-clamp-3"><Rich text={s.description} /></p>

            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {s.href && (
                <Link
                  href={s.href}
                  className="inline-flex items-center gap-2 bg-or px-7 py-3.5 font-caps text-xs uppercase tracking-[0.2em] text-nuit transition-colors hover:bg-or-clair"
                >
                  <Eye className="h-4 w-4" />{s.kind === 'tract' ? t('books.viewTract') : t('books.detail.viewBook')}
                </Link>
              )}
              {s.book && (s.book.preview || s.book.file) && (
                <button
                  onClick={() => onPreview(s.book!)}
                  className="inline-flex items-center gap-2 bg-or px-7 py-3.5 font-caps text-xs uppercase tracking-[0.2em] text-nuit transition-colors hover:bg-or-clair"
                >
                  <Eye className="h-4 w-4" />{t('books.preview')}
                </button>
              )}
              {s.file && (
                <a
                  href={getFileUrl(s.file)} download
                  className="inline-flex items-center gap-2 border border-ivoire/40 px-7 py-3.5 font-caps text-xs uppercase tracking-[0.2em] transition-colors hover:border-or hover:text-or-clair"
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
            className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 border border-ivoire/30 bg-nuit/40 p-3 text-ivoire transition-colors hover:border-or hover:text-or-clair sm:block"
            aria-label="Précédent"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-4 top-1/2 z-30 hidden -translate-y-1/2 border border-ivoire/30 bg-nuit/40 p-3 text-ivoire transition-colors hover:border-or hover:text-or-clair sm:block"
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
                  "h-[3px] transition-all",
                  i === index ? "w-10 bg-or" : "w-4 bg-ivoire/30 hover:bg-ivoire/60"
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

/**
 * `initial*` : catalogue charge cote serveur (en francais). Sans lui, le HTML
 * recu par Google ne contenait aucun lien vers les fiches livres.
 */
export function Publications({ initialBooks, initialTracts, initialCategories }: {
  initialBooks?: Book[]; initialTracts?: Tract[]; initialCategories?: Category[];
} = {}) {
  const { t, language } = useLanguage();
  const hasInitial = Array.isArray(initialBooks) && initialBooks.length > 0;
  const [books, setBooks] = useState<Book[]>(initialBooks ?? []);
  const [tracts, setTracts] = useState<Tract[]>(initialTracts ?? []);
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);
  const [loading, setLoading] = useState(!hasInitial);
  const [previewed, setPreviewed] = useState<Book | null>(null);
  // Le filtre s'appuie sur le slug, jamais sur le libelle : celui-ci est
  // traduit, et le regroupement casserait au changement de langue.
  const [activeCat, setActiveCat] = useState('__all__');
  const [activeLang, setActiveLang] = useState('__all__');
  const [booksShown, setBooksShown] = useState(24);
  const [query, setQuery] = useState('');
  const [showAllLangs, setShowAllLangs] = useState(false);

  // Le serveur a deja fourni la version francaise : inutile de la recharger.
  const skipFirstFetch = useRef(hasInitial && language === 'fr');
  useEffect(() => {
    if (skipFirstFetch.current) { skipFirstFetch.current = false; return; }
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
  const q = foldAccents(query.trim());
  const shownBooks = books
    .filter((b) => matches(b) && (activeLang === '__all__' || (b.languageCode || b.language) === activeLang))
    .filter((b) => !q || foldAccents(b.title).includes(q) || foldAccents(b.author || '').includes(q))
    // Mise en avant par langue du site : les ouvrages dans la langue courante
    // remontent en tete, sans masquer les autres (tri stable).
    .sort((a, b) => {
      const av = (a.languageCode || '') === language ? 0 : 1;
      const bv = (b.languageCode || '') === language ? 0 : 1;
      return av - bv;
    });

  // Langues presentes, pour le filtre. Cle stable (code sinon nom).
  const langMap = new Map<string, string>();
  for (const b of books) {
    const key = b.languageCode || b.language;
    if (key && b.language) langMap.set(key, b.language);
  }
  const languages = Array.from(langMap.entries())
    .sort((a, b) => a[1].localeCompare(b[1]));
  // Filtre langue compact : langues principales d'abord, le reste replie.
  const primaryLangs = languages.filter(([code]) => PRIMARY_LANGS.includes(code || ''));
  const otherLangs = languages.filter(([code]) => !PRIMARY_LANGS.includes(code || ''));
  const visibleLangs = showAllLangs ? [...primaryLangs, ...otherLangs] : primaryLangs;

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
    <main className="min-h-screen bg-nuit text-ivoire">
      {/* Banderole pleine largeur, hors du conteneur : elle doit toucher les
          bords de l'ecran comme le hero de l'accueil. */}
      {!loading && featured.length > 0 ? (
        <FeaturedCarousel slides={featured} onPreview={setPreviewed} />
      ) : (
        // Sans banderole, laisse la place a l'en-tete fixe (bandeau + menu)
        <div className="h-32" aria-hidden />
      )}

      <div className="mx-auto max-w-7xl px-6 pb-28 pt-16">

        <header className="mb-16 text-center">
          <span className="eyebrow inline-flex items-center gap-3 text-or">
            <span className="h-1.5 w-1.5 rotate-45 bg-rouge" aria-hidden />{t('books.label')}
          </span>
          <h1 className="mt-5 font-display text-5xl font-medium text-ivoire md:text-6xl">
            {t('books.title')}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-ivoire/65">
            {t('books.subtitle')}
          </p>
          <div className="mt-5">
            <CmfiLink href={CMFI.books}>{t('home2.cmfi.books')}</CmfiLink>
          </div>

          {/* Recherche + filtre categorie. Les 54 series ztfbooks sont rangees
              sous des themes generaux (<optgroup>) pour rester scannables. */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-or" />
              <input
                type="search"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setBooksShown(24); }}
                placeholder={t('books.searchPlaceholder')}
                className="w-64 border-b border-or/50 bg-transparent py-2 pl-9 pr-4 text-sm text-ivoire placeholder:text-ivoire/40 focus:border-or-clair focus:outline-none"
              />
            </div>

            {categories.length > 0 && (
              <>
                <label className="text-sm font-medium text-ivoire/60">
                  {t('books.filterByCategory')}
                </label>
                <CategoryFilter
                  categories={categories}
                  value={activeCat}
                  onChange={(slug) => { setActiveCat(slug); setBooksShown(24); }}
                  t={t}
                />
              </>
            )}
          </div>
        </header>

        {loading && <p className="text-center text-ivoire/60">{t('books.loading')}</p>}

        {!loading && (
          <>
            {/* Ouvrages mis en avant */}
            {/* Tracts — masques pendant une recherche de livre : ils ne font
                pas partie des resultats et brouilleraient la lecture. */}
            {!q && (
            <section className="mb-16">
              <h2 className="font-display text-4xl text-ivoire">
                {t('books.tractsTitle')}
              </h2>
              <p className="mb-8 mt-2 text-ivoire/60">{t('books.tractsSubtitle')}</p>

              {shownTracts.length === 0 ? (
                <p className="text-ivoire/60">
                  {activeCat === '__all__' ? t('books.noTracts') : t('books.noMatch')}
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {shownTracts.map((tr) => (
                    <Link
                      key={tr.id} href={`/t/${tr.slug}`}
                      className="group block"
                    >
                      {tr.cover && (
                        <div className="aspect-[4/3] overflow-hidden">
                          <img
                            src={getFileUrl(tr.cover)} alt={tr.title}
                            className="fondu-bas h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="pt-1">
                        <h3 className="font-display text-2xl text-ivoire transition-colors group-hover:text-or-clair">
                          <Rich text={tr.title} />
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm text-ivoire/60">
                          <Rich text={tr.description} />
                        </p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="inline-flex items-center gap-1.5 text-ivoire/55">
                            <Languages className="h-4 w-4" />
                            {tr.languageCount} {t('books.languages')}
                          </span>
                          <span className="font-caps text-[11px] uppercase tracking-[0.18em] text-or-clair">{t('books.viewTract')} →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
            )}

            {/* Livres */}
            <section>
              <h2 className="font-display text-4xl text-ivoire">
                {t('books.booksTitle')}
              </h2>
              <p className="mb-6 mt-2 text-ivoire/60">{t('books.booksSubtitle')}</p>

              {/* Filtre par langue — sur code stable, jamais sur le libelle */}
              {languages.length > 1 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => { setActiveLang('__all__'); setBooksShown(24); }}
                    className={`border px-3 py-1 text-sm transition-colors ${
                      activeLang === '__all__'
                        ? 'border-or bg-or text-nuit'
                        : 'border-ivoire/25 text-ivoire/75 hover:border-or hover:text-or-clair'
                    }`}
                  >
                    {t('books.allLanguages')}
                  </button>
                  {visibleLangs.map(([code, name]) => (
                    <button
                      key={code}
                      onClick={() => { setActiveLang(code!); setBooksShown(24); }}
                      className={`border px-3 py-1 text-sm transition-colors ${
                        activeLang === code
                          ? 'border-or bg-or text-nuit'
                          : 'border-ivoire/25 text-ivoire/75 hover:border-or hover:text-or-clair'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                  {otherLangs.length > 0 && (
                    <button
                      onClick={() => setShowAllLangs((v) => !v)}
                      className="border border-dashed border-ivoire/30 px-3 py-1 text-sm text-ivoire/60 transition-colors hover:border-or hover:text-or-clair"
                    >
                      {showAllLangs
                        ? t('books.fewerLanguages')
                        : t('books.moreLanguages').replace('{n}', String(otherLangs.length))}
                    </button>
                  )}
                </div>
              )}

              {shownBooks.length === 0 ? (
                <p className="text-ivoire/60">
                  {q
                    ? t('books.noSearchMatch')
                    : activeCat === '__all__' && activeLang === '__all__'
                      ? t('books.noBooks')
                      : t('books.noMatch')}
                </p>
              ) : (
                <>
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {shownBooks.slice(0, booksShown).map((b) => (
                    <Link
                      key={b.id}
                      href={`/livres/${b.id}`}
                      className="group flex flex-col"
                    >
                      {b.cover && (
                        <div className="relative aspect-[3/4] overflow-hidden bg-charbon shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)] ring-1 ring-ivoire/10 transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_0_40px_-6px_rgba(240,179,35,0.45)] group-hover:ring-or/50">
                          <img
                            src={getFileUrl(b.cover)} alt={b.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          {/* Toutes les langues de l'ouvrage (editions reliees),
                              en haut a droite. Une seule si le livre n'est pas groupe. */}
                          {(() => {
                            const langs = b.groupLanguages?.length
                              ? b.groupLanguages.map((l) => l.name)
                              : (b.language ? [b.language] : []);
                            return langs.length > 0 && (
                              <span className="absolute right-2 top-2 flex max-w-[85%] flex-wrap justify-end gap-1">
                                {langs.map((name) => (
                                  <span key={name} className="bg-nuit/80 px-2 py-0.5 text-[10px] text-or-clair backdrop-blur">
                                    {name}
                                  </span>
                                ))}
                              </span>
                            );
                          })()}
                        </div>
                      )}
                      <div className="flex flex-1 flex-col pt-4">
                        <h3 className="line-clamp-2 font-display text-lg leading-tight text-ivoire transition-colors group-hover:text-or-clair"><Rich text={b.title} /></h3>
                        {b.author && (
                          <p className="mt-1 truncate text-xs text-ivoire/50">
                            {b.author}
                          </p>
                        )}
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                          {b.priceLabel && (
                            <span className="text-xs font-semibold text-or">{b.priceLabel}</span>
                          )}
                          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-or-clair opacity-0 transition-opacity group-hover:opacity-100">
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
                      className="border border-or px-7 py-3.5 font-caps text-xs uppercase tracking-[0.2em] text-or-clair transition-colors hover:bg-or hover:text-nuit"
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
