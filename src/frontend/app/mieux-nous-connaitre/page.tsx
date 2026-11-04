import type { Metadata } from "next"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import { PageHero } from "@/components/site/page-hero"
import { GoldThread } from "@/components/site/motion-kit"
import { About } from "@/components/home/about"
import { Vision } from "@/components/home/vision"
import { Founder } from "@/components/home/founder"
import type { GalleryImage } from "@/components/home/gallery-teaser"
import { Testimonials, type Testimonial } from "@/components/home/testimonials"
import { Contact } from "@/components/home/contact"
import type { Slide } from "@/components/home/hero"
import type { Assembly } from "@/components/assemblies"
import { ChurchJsonLd } from "@/lib/church-jsonld"
import { fetchApi, fetchSettings } from "@/lib/server-data"
import { HOME_PATH } from "@/lib/site"

export const revalidate = 300

const DESCRIPTION = "Qui est la CMCI Belgique : une communauté de disciples dévoués à Jésus-Christ, notre vision, des témoignages et comment nous contacter."

export const metadata: Metadata = {
  title: "Mieux nous connaître — CMCI Belgique",
  description: DESCRIPTION,
  alternates: { canonical: "/mieux-nous-connaitre" },
  openGraph: { title: "Mieux nous connaître — CMCI Belgique", description: DESCRIPTION, url: "/mieux-nous-connaitre", siteName: "CMCI Belgique", type: "website", locale: "fr_BE", images: ["/cmci-logo.png"] },
}

const ANCHORS = [
  { href: "#qui-sommes-nous", labelKey: "home2.pages.knowUs.who" },
  { href: "#fondateur", labelKey: "home2.pages.knowUs.founder" },
  { href: "#vision", labelKey: "nav.vision" },
  { href: "#temoignages", labelKey: "nav.testimonials" },
  { href: "#contact", labelKey: "nav.contact" },
]

/** Page « Mieux nous connaitre » : qui sommes-nous, vision, temoignages, contact complet. */
export default async function MieuxNousConnaitrePage() {
  const [slides, testimonials, assemblies, gallery, settings] = await Promise.all([
    fetchApi<Slide[]>("/api/hero?lang=fr", []),
    fetchApi<Testimonial[]>("/api/testimonials?lang=fr", []),
    fetchApi<Assembly[]>("/api/assemblies?lang=fr", []),
    fetchApi<GalleryImage[]>("/api/gallery", []),
    fetchSettings(),
  ])
  const heroSlides = Array.isArray(slides) ? slides : []
  return (
    <main className="grain-page bg-nuit">
      <ChurchJsonLd settings={settings} assemblies={Array.isArray(assemblies) ? assemblies : []} />
      <SiteHeader home={HOME_PATH} />
      <PageHero
        eyebrowKey="nav.about" titleKey="home2.pages.knowUs.title" leadKey="home2.pages.knowUs.lead"
        image={heroSlides[0]?.image} anchors={ANCHORS} ring
      />
      <About image={heroSlides[2]?.image ?? heroSlides[1]?.image ?? null} />
      <Founder />
      <GoldThread className="h-16" />
      <Vision image={Array.isArray(gallery) ? gallery[0]?.src : null} />
      <Testimonials initial={Array.isArray(testimonials) ? testimonials : []} />
      <Contact settings={settings} />
      <SiteFooter home={HOME_PATH} settings={settings} contactBand={false} />
    </main>
  )
}
