import type { Metadata } from "next"
import { Header } from "@/components/header"
import { Hero, type HeroSlide } from "@/components/hero"
import { Vision } from "@/components/vision"
import { About } from "@/components/about"
import { Values } from "@/components/values"
import Ministries from "@/components/ministries"
import { Events } from "@/components/events"
import { Assemblies, type Assembly } from "@/components/assemblies"
import { Gallery } from "@/components/gallery"
import { Testimonials } from "@/components/testimonials"
import { Newsletter } from "@/components/newsletter"
import { Footer } from "@/components/footer"
import { HashScroll } from "@/components/hash-scroll"
import { fetchApi, fetchSettings } from "@/lib/server-data"

const SITE = "https://www.cmcibelgique.org"

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

const withProtocol = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`)

/** Fiche d'identite lue par Google (donnees structurees schema.org). */
function churchJsonLd(settings: Record<string, string>, assemblies: Assembly[]) {
  const sameAs = Object.entries(settings)
    .filter(([key, value]) => key.startsWith("social_") && value && value !== "#")
    .map(([, value]) => withProtocol(value))

  return {
    "@context": "https://schema.org",
    "@type": "Church",
    name: "CMCI Belgique",
    alternateName: "Communauté Missionnaire Chrétienne Internationale",
    url: SITE,
    logo: `${SITE}/cmci-logo.png`,
    image: `${SITE}/cmci-logo.png`,
    description:
      settings.site_description || "Communauté Missionnaire Chrétienne Internationale en Belgique",
    ...(settings.contact_phone && { telephone: settings.contact_phone }),
    ...(settings.contact_email && { email: settings.contact_email }),
    ...(settings.contact_address && { address: settings.contact_address }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(assemblies.length > 0 && {
      location: assemblies.map((a) => ({
        "@type": "Place",
        name: `CMCI ${a.city}`,
        address: a.address,
        ...(a.latitude != null && a.longitude != null && {
          geo: { "@type": "GeoCoordinates", latitude: a.latitude, longitude: a.longitude },
        }),
      })),
    }),
  }
}

export default async function HomePage() {
  const [slides, assemblies, settings] = await Promise.all([
    fetchApi<HeroSlide[]>("/api/hero?lang=fr", []),
    fetchApi<Assembly[]>("/api/assemblies?lang=fr", []),
    fetchSettings(),
  ])
  const heroSlides = Array.isArray(slides) ? slides : []
  const assemblyList = Array.isArray(assemblies) ? assemblies : []

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(churchJsonLd(settings, assemblyList)).replace(/</g, "\\u003c"),
        }}
      />
      <HashScroll />
      <Header />
      <Hero initialSlides={heroSlides} />
      <Vision />
      <About />
      <Values />
      <Ministries />
      <Events />
      <Assemblies initialAssemblies={assemblyList} />
      <Gallery />
      <Testimonials />
      <Newsletter initialSettings={settings} />
      <Footer />
    </main>
  )
}
