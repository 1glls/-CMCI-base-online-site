import type { Metadata } from 'next';

// Les polices (Cormorant, Cinzel) sont chargees par le layout racine.
export const metadata: Metadata = {
  title: "Banc d'essai design — CMCI Belgique",
  robots: { index: false, follow: false },
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
