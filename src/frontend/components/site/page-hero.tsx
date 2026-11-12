"use client"

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useRef } from "react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { Reveal, WordsReveal } from "./motion-kit"
import { Rich } from "./rich-text"
import { AutoSlideshow } from "./auto-slideshow"
import { Filigree } from "./filigree"

/**
 * En-tete des pages interieures : surtitre, grand titre (h1) revele mot a
 * mot, introduction, image fondue en fond (ou diaporama automatique si
 * `slides` contient plusieurs photos), anneau de texte decoratif optionnel,
 * et sommaire d'ancres vers les parties de la page. Les textes sont des cles
 * de traduction.
 */
export function PageHero({
  eyebrowKey, titleKey, leadKey, image, slides, ring = false, anchors = [],
}: {
  eyebrowKey: string; titleKey: string; leadKey: string; image?: string | null
  slides?: string[]; ring?: boolean
  anchors?: { href: string; labelKey: string }[]
}) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "25%"])

  return (
    <section ref={ref} className="relative overflow-hidden bg-nuit pb-20 pt-48 text-ivoire md:pb-28 md:pt-56">
      {slides && slides.length > 1 ? (
        <motion.div aria-hidden style={{ y }} className="absolute inset-y-0 right-0 h-full w-full md:w-[70%]">
          <AutoSlideshow eager images={slides} className="fondu-fond photo-fond h-full w-full" />
        </motion.div>
      ) : (image || slides?.[0]) && (
        <motion.img
          aria-hidden style={{ y }}
          src={getImageUrl(image || slides?.[0])} alt=""
          className="fondu-fond photo-fond absolute inset-y-0 right-0 h-full w-full object-cover md:w-[70%]"
        />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-nuit via-nuit/80 to-transparent" />
      <div aria-hidden className="absolute -left-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-or halo blur-[130px]" />
      {ring && <Filigree kind="ring" className="right-[8%] top-28 hidden h-80 w-80 lg:block" />}

      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="eyebrow flex items-center gap-3 text-or-clair">
            <span className="h-px w-10 bg-or" aria-hidden />{t(eyebrowKey)}
          </span>
        </Reveal>
        <h1 className="mt-6 max-w-4xl font-display text-[clamp(3rem,7vw,6.4rem)] font-medium leading-[0.98]">
          <WordsReveal text={t(titleKey)} />
        </h1>
        <Reveal delay={0.3}>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ivoire/75"><Rich text={t(leadKey)} /></p>
        </Reveal>
        {anchors.length > 0 && (
          <Reveal delay={0.45}>
            <nav className="mt-12 flex flex-wrap gap-x-8 gap-y-3" aria-label={t(titleKey)}>
              {anchors.map((a, i) => (
                <a key={a.href} href={a.href} className="group flex items-center gap-3 font-caps text-[11px] uppercase tracking-[0.22em] text-ivoire/70 hover:text-or-clair">
                  <span className="text-or">{String(i + 1).padStart(2, "0")}</span>
                  <span className="border-b border-transparent pb-1 group-hover:border-or">{t(a.labelKey)}</span>
                </a>
              ))}
            </nav>
          </Reveal>
        )}
      </div>
    </section>
  )
}
