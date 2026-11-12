"use client"

import { motion } from "motion/react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { CircularText, Reveal, WordsReveal, useParallax } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"
import { Filigree } from "@/components/site/filigree"

/**
 * Qui sommes-nous : photo dans une arche, anneau de texte tournant repris du
 * logo, lettrine rouge et citation de la vision.
 */
export function About({ image }: { image: string | null }) {
  const { t } = useLanguage()
  const { ref, y } = useParallax(60)

  return (
    <section id="qui-sommes-nous" className="relative overflow-hidden bg-nuit py-24 text-ivoire md:py-28">
      <Filigree kind="cross" className="right-[4%] top-10 hidden h-[34rem] lg:block" />
      <div className="mx-auto grid max-w-7xl items-center gap-20 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div ref={ref} className="relative mx-auto w-full max-w-md">
          <motion.div style={{ y }} className="relative aspect-[3/4]">
            <img src={getImageUrl(image, "/images/hero-mission.jpg")} alt="" loading="lazy" decoding="async" className="fondu-vers-droite h-full w-full scale-110 object-cover" />
          </motion.div>
          {/* Anneau de texte tournant, pose a cheval sur l'arche */}
          <div className="absolute -bottom-12 -right-6 h-40 w-40 text-or-clair md:-right-14 md:h-48 md:w-48">
            <CircularText text={t("home2.about.circular")} className="absolute inset-0 h-full w-full" />
            <span aria-hidden className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-rouge" />
          </div>
        </div>

        <div>
          <Reveal>
            <span className="eyebrow flex items-center gap-3 text-or">
              <span className="h-px w-10 bg-or" aria-hidden />{t("home2.about.label")}
            </span>
          </Reveal>
          <h2 className="mt-6 font-display text-[clamp(2.4rem,4.6vw,4.2rem)] leading-[1.04]">
            <WordsReveal text={t("home2.about.title")} />
          </h2>
          <Reveal delay={0.15}>
            <p className="mt-10 text-lg leading-relaxed text-ivoire/80 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-7xl first-letter:leading-[0.8] first-letter:text-rouge">
              <Rich text={t("about.paragraph1")} />
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <p className="mt-5 leading-relaxed text-ivoire/60"><Rich text={t("about.paragraph2")} /></p>
          </Reveal>
          <Reveal delay={0.35}>
            <blockquote className="mt-12 border-l border-or pl-8">
              <p className="font-display text-2xl italic leading-snug text-or-clair md:text-3xl">
                «&nbsp;<Rich text={t("about.quote")} />&nbsp;»
              </p>
              <cite className="eyebrow mt-4 block not-italic !text-[10px] text-ivoire/50">{t("about.quoteAuthor")}</cite>
            </blockquote>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
