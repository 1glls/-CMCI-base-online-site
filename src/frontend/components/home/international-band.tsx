"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { CMFI } from "@/lib/cmfi"
import { AutoSlideshow } from "@/components/site/auto-slideshow"
import { CmfiLink } from "@/components/site/cmfi-link"
import { Reveal } from "@/components/site/motion-kit"

/**
 * Large bande d'images en defilement automatique (photos de la galerie, sans
 * vignettes), fondue en haut et en bas, avec le lien vers les temps forts de
 * la CMCI internationale (page Temps forts).
 */
export function InternationalBand({ images }: { images: string[] }) {
  const { t } = useLanguage()
  return (
    <section className="relative overflow-hidden text-ivoire">
      {images.length > 0 && (
        <AutoSlideshow images={images} className="fondu photo-fond h-[70vh] min-h-[420px] w-full" />
      )}
      <div className={`${images.length > 0 ? "absolute inset-x-0 bottom-[14%]" : "py-20"} mx-auto max-w-7xl px-6`}>
        <Reveal>
          <p className="max-w-xl font-display text-[clamp(1.8rem,3.4vw,3rem)] leading-tight">{t("home2.pages.highlights.international")}</p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <CmfiLink href={CMFI.home}>{t("home2.cmfi.site")}</CmfiLink>
            <CmfiLink href={CMFI.fiveYearGoal}>{t("home2.cmfi.fiveYearGoal")}</CmfiLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
