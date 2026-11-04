import type { Assembly } from "@/components/assemblies"

const SITE = "https://www.cmcibelgique.org"

const withProtocol = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`)

/** Fiche d'identite lue par Google (donnees structurees schema.org). */
export function churchJsonLd(settings: Record<string, string>, assemblies: Assembly[]) {
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

/** Balise <script> JSON-LD a poser dans une page (donnees structurees Google). */
export function ChurchJsonLd({ settings, assemblies }: { settings: Record<string, string>; assemblies: Assembly[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(churchJsonLd(settings, assemblies)).replace(/</g, "\\u003c") }}
    />
  )
}
