"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { Reveal } from "./motion-kit"
import { Rich } from "./rich-text"

/**
 * Passage biblique mis en valeur : guillemet or geant, texte en Garamond
 * italique, reference en capitales (le nom de Jesus en rouge, via <Rich>).
 * `verse` designe une entree de home2.verses.* dans les traductions
 * (Louis Segond 1910, King James, Statenvertaling : domaine public).
 */
export function Scripture({
  verse, size = "lg", align = "center", className = "",
}: { verse: "mission" | "contact"; size?: "lg" | "md"; align?: "center" | "left"; className?: string }) {
  const { t } = useLanguage()
  const centered = align === "center"
  return (
    <Reveal className={className}>
      <figure className={`relative ${centered ? "mx-auto max-w-4xl text-center" : "max-w-xl"}`}>
        <span aria-hidden className={`pointer-events-none absolute select-none font-display leading-none text-or/25 ${size === "lg" ? "-top-14 text-[9rem]" : "-top-8 text-[5.5rem]"} ${centered ? "left-1/2 -translate-x-1/2" : "-left-3"}`}>“</span>
        <blockquote className={`relative font-display italic text-ivoire ${size === "lg" ? "text-[clamp(1.5rem,2.8vw,2.3rem)] leading-snug" : "text-xl leading-snug md:text-2xl"}`}>
          «&nbsp;<Rich text={t(`home2.verses.${verse}.text`)} />&nbsp;»
        </blockquote>
        <figcaption className={`mt-5 flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
          <span aria-hidden className="h-px w-8 bg-or" />
          <span className="eyebrow !text-[10px] text-or-clair"><Rich text={t(`home2.verses.${verse}.ref`)} /></span>
          <span aria-hidden className="h-px w-8 bg-or" />
        </figcaption>
      </figure>
    </Reveal>
  )
}
