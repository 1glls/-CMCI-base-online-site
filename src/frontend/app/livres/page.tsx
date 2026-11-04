import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site/header';
import { SiteFooter } from '@/components/site/footer';
import { fetchSettings } from '@/lib/server-data';
import { HOME_PATH } from '@/lib/site';
import { Publications } from '@/components/publications';

const DESCRIPTION =
  'Les ouvrages et tracts de la Communauté Missionnaire Chrétienne Internationale en Belgique, à lire, télécharger et partager.';

export const metadata: Metadata = {
  title: 'Livre & littérature — CMCI Belgique',
  description: DESCRIPTION,
  alternates: { canonical: '/livres' },
  openGraph: {
    title: 'Livre & littérature — CMCI Belgique',
    description: DESCRIPTION,
    url: '/livres',
    siteName: 'CMCI Belgique',
    type: 'website',
    locale: 'fr_BE',
    images: ['/cmci-logo.png'],
  },
};

export default async function LivresPage() {
  const settings = await fetchSettings();
  // Aucun layout public partage n'existe : la page monte elle-meme
  // l'en-tete et le pied de page, comme app/page.tsx.
  return (
    <div className="grain-page bg-nuit">
      <SiteHeader home={HOME_PATH} />
      <Publications />
      <SiteFooter home={HOME_PATH} settings={settings} />
    </div>
  );
}
