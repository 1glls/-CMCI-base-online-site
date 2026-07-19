import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { TractViewer } from '@/components/tract-viewer';
import { API_URL, getFileUrl } from '@/lib/api';

// Un QR-code imprime vit des annees : la page doit refleter l'etat courant
// du tract, pas une version figee au moment du build.
export const dynamic = 'force-dynamic';

async function fetchTract(slug: string) {
  try {
    const res = await fetch(`${API_URL}/api/tracts/slug/${encodeURIComponent(slug)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tract = await fetchTract(slug);
  if (!tract) return { title: 'Tract introuvable — CMCI Belgique' };

  // Ces liens circulent par WhatsApp dans les diasporas : l'apercu de
  // partage compte autant que la page elle-meme.
  return {
    title: `${tract.title} — CMCI Belgique`,
    description: tract.description || undefined,
    openGraph: {
      title: tract.title,
      description: tract.description || undefined,
      type: 'article',
      images: tract.cover ? [getFileUrl(tract.cover)] : undefined
    }
  };
}

export default async function TractPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ de?: string; lang?: string }>;
}) {
  const { slug } = await params;
  const { de, lang } = await searchParams;

  const tract = await fetchTract(slug);
  if (!tract) notFound();

  return (
    <>
      <Header />
      <div className="pt-24">
        <TractViewer tract={tract} from={lang || de} />
      </div>
      <Footer />
    </>
  );
}
