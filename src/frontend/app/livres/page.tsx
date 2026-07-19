import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Publications } from '@/components/publications';

export const metadata: Metadata = {
  title: 'Livre & littérature — CMCI Belgique',
  description:
    'Les ouvrages et tracts de la Communauté Missionnaire Chrétienne Internationale en Belgique, à lire, télécharger et partager.',
};

export default function LivresPage() {
  // Aucun layout public partage n'existe : la page monte elle-meme
  // l'en-tete et le pied de page, comme app/page.tsx.
  return (
    <>
      <Header />
      <Publications />
      <Footer />
    </>
  );
}
