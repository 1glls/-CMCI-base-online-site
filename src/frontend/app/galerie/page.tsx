import type { Metadata } from "next"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import { PageHero } from "@/components/site/page-hero"
import { GalleryViews, type GalleryView } from "@/components/gallery/gallery-views"
import type { GalleryImage } from "@/components/home/gallery-teaser"
import { fetchApi, fetchSettings } from "@/lib/server-data"
import { HOME_PATH } from "@/lib/site"

const DESCRIPTION = "Cultes, conférences, moments fraternels : la vie de la CMCI Belgique en images."

export const metadata: Metadata = {
  title: "Galerie — CMCI Belgique",
  description: DESCRIPTION,
  alternates: { canonical: "/galerie" },
  openGraph: { title: "Galerie — CMCI Belgique", description: DESCRIPTION, url: "/galerie", siteName: "CMCI Belgique", type: "website", locale: "fr_BE", images: ["/cmci-logo.png"] },
}

/**
 * Page Galerie : toutes les photos publiees dans l'admin Galerie, en vue
 * « Une par une » (par defaut) ou « Catalogue » (?vue=catalogue).
 */
export default async function GaleriePage({ searchParams }: { searchParams: Promise<{ vue?: string }> }) {
  const [{ vue }, gallery, settings] = await Promise.all([
    searchParams,
    fetchApi<GalleryImage[]>("/api/gallery", []),
    fetchSettings(),
  ])
  const images = Array.isArray(gallery) ? gallery : []
  const view: GalleryView = vue === "catalogue" ? "catalogue" : "une"
  return (
    <main className="grain-page bg-nuit">
      <SiteHeader home={HOME_PATH} />
      <PageHero
        eyebrowKey="home2.galleryTeaser.label" titleKey="home2.galleryTeaser.title" leadKey="home2.pages.gallery.lead"
        slides={images.map((i) => i.src)}
      />
      <section className="bg-nuit pb-32 text-ivoire">
        <GalleryViews images={images} initialView={view} />
      </section>
      <SiteFooter home={HOME_PATH} settings={settings} />
    </main>
  )
}
