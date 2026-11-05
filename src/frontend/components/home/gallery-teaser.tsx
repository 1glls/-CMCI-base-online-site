"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Reveal, WordsReveal } from "@/components/site/motion-kit"
import { AutoSlideshow } from "@/components/site/auto-slideshow"

export interface GalleryImage { id: string; src: string; alt: string | null; category?: string | null }

/**
 * Apercu de la galerie : une seule grande image, qui touche le bord droit de
 * l'ecran et se dissout vers le texte, en diaporama automatique (photos de
 * l'admin Galerie, sans vignettes). Le bouton mene a /galerie.
 */
export function GalleryTeaser({ images }: { images: GalleryImage[] }) {
  const { t } = useLanguage()
  if (images.length === 0) return null
  const srcs = images.map((i) => i.src)

  return (
    <section id="galerie" className="relative overflow-hidden bg-nuit text-ivoire">
      {/* Image : moitie droite de l'ecran, fondue vers la gauche et en haut/bas */}
      <Link href="/galerie" aria-label={t("home2.galleryTeaser.cta")} className="absolute inset-y-0 right-0 hidden w-[62%] md:block">
        <AutoSlideshow images={srcs} className="fondu-vers-gauche h-full w-full" />
      </Link>

      <div className="relative mx-auto flex min-h-[34rem] max-w-7xl items-center px-6 py-24 md:min-h-[40rem]">
        <div className="max-w-md">
          <Reveal>
            <span className="eyebrow flex items-center gap-3 text-or">
              <span className="h-px w-10 bg-or" aria-hidden />{t("home2.galleryTeaser.label")}
            </span>
          </Reveal>
          <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.03]">
            <WordsReveal text={t("home2.galleryTeaser.title")} />
          </h2>
          <Reveal delay={0.25}>
            <Link href="/galerie" className="group mt-9 inline-flex items-center gap-3 border border-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-or-clair transition-colors hover:bg-or hover:text-nuit">
              {t("home2.galleryTeaser.cta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>
      </div>

      {/* Mobile : l'image passe sous le texte, fondue sur tous les bords */}
      <Link href="/galerie" aria-label={t("home2.galleryTeaser.cta")} className="block md:hidden">
        <AutoSlideshow images={srcs} className="fondu -mt-10 h-80 w-full" />
      </Link>
    </section>
  )
}
