import type { Metadata } from "next"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import { PageHero } from "@/components/site/page-hero"
import { CountdownList } from "@/components/home/countdown-list"
import { InternationalBand } from "@/components/home/international-band"
import type { GalleryImage } from "@/components/home/gallery-teaser"
import type { Countdown } from "@/lib/countdown"
import { fetchApi, fetchSettings } from "@/lib/server-data"
import { HOME_PATH } from "@/lib/site"

export const revalidate = 60

const DESCRIPTION = "Les grands rendez-vous de la CMCI Belgique, avec leur compte à rebours et toutes les infos pratiques."

export const metadata: Metadata = {
  title: "Temps forts — CMCI Belgique",
  description: DESCRIPTION,
  alternates: { canonical: "/temps-forts" },
  openGraph: { title: "Temps forts — CMCI Belgique", description: DESCRIPTION, url: "/temps-forts", siteName: "CMCI Belgique", type: "website", locale: "fr_BE", images: ["/cmci-logo.png"] },
}

/** Page « Temps forts » : tous les comptes a rebours en cours ou a venir. */
export default async function TempsFortsPage() {
  const [countdowns, gallery, settings] = await Promise.all([
    fetchApi<Countdown[]>("/api/countdowns?lang=fr", [], 60),
    fetchApi<GalleryImage[]>("/api/gallery", []),
    fetchSettings(),
  ])
  const list = Array.isArray(countdowns) ? countdowns : []
  // Photos de l'admin Galerie : diaporama de l'en-tete et grande bande defilante
  const photos = (Array.isArray(gallery) ? gallery : []).map((g) => g.src)
  return (
    <main className="grain-page bg-nuit">
      <SiteHeader home={HOME_PATH} countdowns={list} />
      <PageHero
        eyebrowKey="home2.nav.highlights" titleKey="home2.pages.highlights.title" leadKey="home2.pages.highlights.lead"
        image={list.find((c) => c.image)?.image} slides={photos}
      />
      <CountdownList initial={list} home={HOME_PATH} />
      <InternationalBand images={[...photos].reverse()} />
      <SiteFooter home={HOME_PATH} settings={settings} />
    </main>
  )
}
