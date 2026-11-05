import type { Metadata } from "next"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import { SectionReveal, SectionSeam } from "@/components/site/section-transition"
import { Hero, type HeroMode, type Slide } from "@/components/home/hero"
import { FeaturedStrip } from "@/components/home/featured-strip"
import type { SocialPost } from "@/components/home/social-badge"
import { AboutTeaser } from "@/components/home/about-teaser"
import { Values } from "@/components/home/values"
import { Ministries, type Ministry } from "@/components/home/ministries"
import { Events, type EventItem } from "@/components/home/events"
import { Assemblies } from "@/components/home/assemblies"
import { GalleryTeaser, type GalleryImage } from "@/components/home/gallery-teaser"
import type { HeroBook } from "@/components/home/book-fan"
import type { Assembly } from "@/components/assemblies"
import type { Countdown } from "@/lib/countdown"
import { ChurchJsonLd } from "@/lib/church-jsonld"
import { fetchApi, fetchSettings } from "@/lib/server-data"
import { HOME_PATH } from "@/lib/site"

// Regenere toutes les 5 minutes : les modifications de l'admin apparaissent
// vite, sans interroger l'API a chaque visite.
export const revalidate = 300

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "CMCI Belgique - Communauté Missionnaire Chrétienne Internationale",
    description: "Une communauté de disciples dévoués à Jésus-Christ",
    url: "/",
    siteName: "CMCI Belgique",
    type: "website",
    locale: "fr_BE",
    images: ["/cmci-logo.png"],
  },
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

/**
 * Page d'accueil « Nuit & or ». Toutes les donnees viennent de l'admin et sont
 * rendues cote serveur (lisibles par Google) ; le mode du hero (« livres » ou
 * « diaporama ») est le reglage Parametres → Haut de la page d'accueil.
 */
export default async function HomePage() {
  const [slides, books, countdowns, events, ministries, gallery, assemblies, socialPosts, settings] = await Promise.all([
    fetchApi<Slide[]>("/api/hero?lang=fr", [], 60),
    fetchApi<HeroBook[]>("/api/books/hero", [], 60),
    fetchApi<Countdown[]>("/api/countdowns?lang=fr", [], 60),
    fetchApi<EventItem[]>("/api/events?lang=fr", [], 60),
    fetchApi<Ministry[]>("/api/ministries?lang=fr", [], 60),
    fetchApi<GalleryImage[]>("/api/gallery", [], 60),
    fetchApi<Assembly[]>("/api/assemblies?lang=fr", [], 60),
    fetchApi<SocialPost[]>("/api/social-media", [], 60),
    fetchSettings(),
  ])
  const mode: HeroMode = settings.hero_mode === "diaporama" ? "diaporama" : "livres"
  const heroSlides = arr<Slide>(slides)
  const assemblyList = arr<Assembly>(assemblies)
  const posts = arr<SocialPost>(socialPosts)
  // Nombre de publications des reseaux dans le haut de l'accueil (admin Reseaux sociaux)
  const socialCount = Math.max(0, Math.min(6, parseInt(settings.social_hero_count ?? "3", 10) || 0))

  // Ordre valide : hero, a la une, mieux nous connaitre, identite, ministeres,
  // agenda, assemblees, galerie, puis contact + pied de page fusionnes.
  return (
    <main className="grain-page bg-nuit">
      <ChurchJsonLd settings={settings} assemblies={assemblyList} />
      <SiteHeader home={HOME_PATH} countdowns={arr<Countdown>(countdowns)} />
      <Hero mode={mode} initialSlides={heroSlides} books={arr<HeroBook>(books)} posts={posts} socialCount={socialCount} />
      {/* Entre les sections : couture doree animee, et chaque section monte en apparaissant */}
      {/* « A la une » (mode Message + livres) : annonces + publications des reseaux */}
      {mode === "livres" && (
        <SectionReveal><FeaturedStrip slides={heroSlides} posts={posts} socialCount={socialCount} /></SectionReveal>
      )}
      <SectionSeam />
      <SectionReveal><AboutTeaser /></SectionReveal>
      {/* Notre identite a ses propres arches d'entree et de sortie */}
      <Values />
      <SectionReveal><Ministries initial={arr<Ministry>(ministries)} /></SectionReveal>
      <SectionSeam />
      <SectionReveal><Events initial={arr<EventItem>(events)} /></SectionReveal>
      <SectionSeam />
      <SectionReveal><Assemblies initial={assemblyList} /></SectionReveal>
      <SectionSeam />
      <SectionReveal><GalleryTeaser images={arr<GalleryImage>(gallery)} /></SectionReveal>
      <SectionSeam />
      <SiteFooter home={HOME_PATH} settings={settings} />
    </main>
  )
}
