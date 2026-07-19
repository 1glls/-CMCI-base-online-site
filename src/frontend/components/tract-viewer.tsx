'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Download, FileText, X, ArrowLeft } from 'lucide-react';
import { getFileUrl } from '@/lib/api';

interface Version {
  id: string;
  language: string;
  label: string;
  dir: string;
  title: string;
  file: string | null;
  previews: string[];
}

interface Tract {
  slug: string;
  title: string;
  description: string;
  cover: string | null;
  versions: Version[];
}

/**
 * Page d'arrivee du QR-code imprime.
 *
 * Concue pour quelqu'un qui vient de scanner un tract papier : sur telephone,
 * debout, connexion mediocre. D'ou trois partis pris :
 *   - le choix de la langue est une grille de boutons, pas un menu deroulant
 *   - l'apercu est affiche dans le flux, pas derriere une modale : sur mobile,
 *     un apercu qu'il faut ouvrir est un apercu qu'on n'ouvre pas
 *   - ce sont des images de pages, pas un PDF embarque : iOS Safari et Chrome
 *     Android rendent mal un PDF en iframe et forcent souvent le
 *     telechargement, ce qui detruit la notion d'apercu
 */
export function TractViewer({ tract, from }: { tract: Tract; from?: string }) {
  const initial =
    tract.versions.find((v) => v.language === from) ?? tract.versions[0];
  const [current, setCurrent] = useState<Version | undefined>(initial);
  const [zoom, setZoom] = useState<string | null>(null);

  const fromVersion = from
    ? tract.versions.find((v) => v.language === from)
    : undefined;

  const select = (v: Version) => {
    setCurrent(v);
    // L'URL suit le choix : la page reste partageable telle qu'elle est vue.
    const url = new URL(window.location.href);
    url.searchParams.set('lang', v.language);
    window.history.replaceState({}, '', url);
  };

  if (!current) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 font-serif text-2xl font-bold">{tract.title}</h1>
        <p className="text-muted-foreground">
          Aucune version n&apos;est encore disponible au téléchargement.
        </p>
        <Link href="/livres" className="mt-6 inline-block text-primary underline">
          Voir nos autres publications
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6" dir={current.dir}>
      {/* Titre */}
      <header className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold leading-tight text-primary sm:text-3xl">
          {current.title || tract.title}
        </h1>
        {tract.description && (
          <p className="mt-2 text-sm text-muted-foreground">{tract.description}</p>
        )}
      </header>

      {/* Accueil si l'on vient d'un tract papier */}
      {fromVersion && (
        <p className="mb-5 rounded-lg bg-secondary px-4 py-3 text-center text-sm">
          Vous avez ce tract en <strong>{fromVersion.label}</strong>.
          {tract.versions.length > 1 && ' Il existe aussi dans ces langues :'}
        </p>
      )}

      {/* Choix de la langue — mis en evidence, jamais dans un menu */}
      {tract.versions.length > 1 && (
        <section className="mb-6">
          <h2 className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Choisissez votre langue
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {tract.versions.map((v) => (
              <button
                key={v.id}
                onClick={() => select(v)}
                lang={v.language}
                dir={v.dir}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  v.id === current.id
                    ? 'border-primary bg-primary text-primary-foreground font-semibold'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Telechargement — visible sans defiler */}
      {current.file && (
        <a
          href={getFileUrl(current.file)}
          download
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-accent-foreground shadow-sm transition-colors hover:bg-accent/90"
        >
          <Download className="h-5 w-5" />
          Télécharger le PDF
        </a>
      )}

      {/* Apercu dans le flux */}
      {current.previews.length > 0 ? (
        <section>
          <h2 className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Aperçu
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {current.previews.map((src, i) => (
              <button
                key={src}
                onClick={() => setZoom(getFileUrl(src))}
                className="overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <img
                  src={getFileUrl(src)}
                  alt={`${current.title} — page ${i + 1}`}
                  className="w-full"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="text-center text-sm text-muted-foreground">
          L&apos;aperçu de cette version n&apos;est pas encore disponible.
        </p>
      )}

      <div className="mt-10 text-center">
        <Link
          href="/livres"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Nos livres et publications
        </Link>
      </div>

      {/* Plein ecran */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(null)}
        >
          <button
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/20"
            aria-label="Fermer"
          >
            <X size={28} />
          </button>
          <img src={zoom} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </main>
  );
}
