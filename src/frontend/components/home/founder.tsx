"use client"

import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { CMFI } from "@/lib/cmfi"
import { Reveal, WordsReveal, useParallax } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"
import { CmfiLink } from "@/components/site/cmfi-link"

/**
 * Notre fondateur, le Professeur Zacharias Tanee Fomum (page Mieux nous
 * connaitre). Portrait officiel de la CMFI (copie locale :
 * public/images/fondateur-ztf.webp), fondu vers le texte ; biographie courte
 * redigee d'apres cmfinternational.org/founder, et liens vers les neuf
 * chapitres de sa biographie sur le site mere.
 */
export function Founder() {
  const { t } = useLanguage()
  const { ref, y } = useParallax(50)

  return (
    <section id="fondateur" className="bande relative overflow-hidden py-24 text-ivoire md:py-28">
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Portrait, plein a gauche et dissous vers le texte */}
        <div ref={ref} className="relative mx-auto h-[30rem] w-full max-w-md md:h-[38rem]">
          <motion.img
            style={{ y }}
            src="/images/fondateur-ztf.webp" alt={t("home2.founder.name")}
            className="fondu-vers-droite absolute inset-0 h-full w-full scale-110 object-cover object-top"
          />
          <span aria-hidden className="absolute bottom-6 right-0 font-display text-6xl leading-none text-outline-or opacity-60 md:text-7xl">1975</span>
        </div>

        <div>
          <Reveal>
            <span className="eyebrow flex items-center gap-3 text-or">
              <span className="h-px w-10 bg-or" aria-hidden />{t("home2.founder.label")}
            </span>
          </Reveal>
          <h2 className="mt-6 font-display text-[clamp(2.4rem,4.6vw,4.2rem)] leading-[1.02]">
            <WordsReveal text={t("home2.founder.name")} />
          </h2>
          <Reveal delay={0.1}>
            <p className="mt-3 font-caps text-sm tracking-[0.3em] text-or-clair">{t("home2.founder.years")}</p>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-8 text-lg leading-relaxed text-ivoire/80"><Rich text={t("home2.founder.p1")} /></p>
            <p className="mt-4 leading-relaxed text-ivoire/65"><Rich text={t("home2.founder.p2")} /></p>
            <p className="mt-4 leading-relaxed text-ivoire/65"><Rich text={t("home2.founder.p3")} /></p>
          </Reveal>
          <Reveal delay={0.3}>
            <blockquote className="mt-10 border-l border-rouge pl-6">
              <p className="font-display text-2xl italic text-or-clair">«&nbsp;<Rich text={t("home2.founder.quote")} />&nbsp;»</p>
              <cite className="eyebrow mt-3 block not-italic !text-[10px] text-ivoire/50">{t("home2.founder.quoteRef")}</cite>
            </blockquote>
          </Reveal>
        </div>
      </div>

      {/* Les neuf chapitres de sa biographie sur le site mere */}
      <div className="relative mx-auto mt-20 max-w-7xl px-6">
        <Reveal>
          <p className="eyebrow !text-[10px] text-ivoire/55">{t("home2.founder.chaptersTitle")}</p>
        </Reveal>
        <ol className="mt-6 grid border-t border-ivoire/12 sm:grid-cols-2 lg:grid-cols-3">
          {CMFI.founderChapters.map((c, i) => (
            <Reveal as="li" key={c.key} delay={(i % 3) * 0.06} className="border-b border-ivoire/12">
              <a
                href={c.href} target="_blank" rel="noopener noreferrer"
                className="group flex items-baseline gap-4 py-4 pr-4 transition-colors hover:text-or-clair"
              >
                <span className="font-caps text-xs text-or">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-xl">{t(`home2.founder.chapters.${c.key}`)}</span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-ivoire/30 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-or" />
              </a>
            </Reveal>
          ))}
        </ol>
        <Reveal delay={0.2}>
          <div className="mt-10">
            <CmfiLink href={CMFI.founder}>{t("home2.founder.cta")}</CmfiLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
