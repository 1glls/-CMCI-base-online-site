import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { fetchSettings } from '@/lib/server-data';
import { HOME_PATH } from '@/lib/site';

/**
 * Un QR-code imprime circule pendant des annees, bien apres qu'un tract ait
 * pu etre retire ou renomme. La page doit donc echouer dignement et proposer
 * une suite, jamais afficher une erreur brute.
 */
export default async function TractNotFound() {
  const settings = await fetchSettings();
  return (
    <div className="grain-page bg-nuit text-ivoire">
      <SiteHeader home={HOME_PATH} />
      <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 pt-36 text-center">
        <FileQuestion className="mb-4 h-14 w-14 text-or/60" />
        <h1 className="mb-3 font-display text-4xl">
          Ce tract n&apos;est plus disponible
        </h1>
        <p className="mb-8 text-ivoire/65">
          Le document que vous cherchez a peut-être été retiré ou déplacé.
          Nos autres publications restent accessibles.
        </p>
        <Link
          href="/livres"
          className="bg-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-nuit transition-colors hover:bg-or-clair"
        >
          Voir nos livres et publications
        </Link>
        <Link href={HOME_PATH} className="mt-5 text-sm text-ivoire/55 hover:text-or-clair">
          Retour à l&apos;accueil
        </Link>
      </main>
      <SiteFooter home={HOME_PATH} settings={settings} />
    </div>
  );
}
