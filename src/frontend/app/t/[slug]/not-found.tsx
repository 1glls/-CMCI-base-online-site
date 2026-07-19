import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

/**
 * Un QR-code imprime circule pendant des annees, bien apres qu'un tract ait
 * pu etre retire ou renomme. La page doit donc echouer dignement et proposer
 * une suite, jamais afficher une erreur brute.
 */
export default function TractNotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 pt-24 text-center">
        <FileQuestion className="mb-4 h-14 w-14 text-muted-foreground" />
        <h1 className="mb-3 font-serif text-2xl font-bold text-primary">
          Ce tract n&apos;est plus disponible
        </h1>
        <p className="mb-8 text-muted-foreground">
          Le document que vous cherchez a peut-être été retiré ou déplacé.
          Nos autres publications restent accessibles.
        </p>
        <Link
          href="/livres"
          className="rounded-full bg-accent px-6 py-3 font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          Voir nos livres et publications
        </Link>
        <Link href="/" className="mt-4 text-sm text-muted-foreground hover:text-primary">
          Retour à l&apos;accueil
        </Link>
      </main>
      <Footer />
    </>
  );
}
