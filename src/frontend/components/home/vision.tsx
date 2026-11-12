"use client"

import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useLanguage } from "@/contexts/LanguageContext"
import { CountUp, Reveal, WordsReveal } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"
import { Filigree } from "@/components/site/filigree"
import { CmfiLink } from "@/components/site/cmfi-link"
import { getImageUrl } from "@/lib/api"
import { CMFI } from "@/lib/cmfi"

/**
 * Vision : ligne du temps 2026 → 2065 qui se dessine au defilement, quatre
 * jalons chiffres, puis les trois axes (evangeliser, former, prier) en
 * colonnes typographiques separees par des filets. En fond : une photo fondue
 * (galerie) et le filigrane « 1975 — 2065 » ; liens vers le site mere.
 */
export function Vision({ image }: { image?: string | null }) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const line = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: line, offset: ["start 85%", "end 45%"] })
  const draw = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0, 1])

  const stations = [
    { to: 10, unit: t("home2.vision.billions"), label: t("home2.vision.people") },
    { to: 1, unit: t("home2.vision.billion"), label: t("home2.vision.disciples") },
    { to: 250, unit: "", label: t("home2.vision.nations") },
    { to: 2065, unit: "", label: t("home2.vision.deadline"), plain: true },
  ]
  const axes = [1, 2, 3].map((i) => ({
    title: t(`vision.item${i}.title`),
    text: t(`vision.item${i}.description`),
  }))

  return (
    <section id="vision" className="bande relative overflow-hidden pb-28 pt-16 text-ivoire">
      {image && (
        /* Attenuee (60 % de l'intensite des photos de fond) : le texte passe devant */
        <img aria-hidden src={getImageUrl(image)} alt="" loading="lazy" decoding="async" style={{ opacity: "calc(var(--photo-fond) * .6)" }} className="fondu-vers-gauche pointer-events-none absolute right-0 top-0 h-[70%] w-full object-cover md:w-[48%]" />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-nuit via-nuit/75 to-transparent" />
      <Filigree kind="text" text="1975 — 2065" className="-right-10 top-10 text-[clamp(6rem,14vw,13rem)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <Reveal>
            <span className="eyebrow flex items-center gap-3 text-or">
              <span className="h-px w-10 bg-or" aria-hidden />{t("home2.vision.label")}
            </span>
          </Reveal>
          <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.02]">
            <WordsReveal text={t("home2.vision.title")} />
          </h2>
        </div>

        {/* Ligne du temps : chiffre (h-24 / md:h-32), puis rangee des losanges posee sur la ligne */}
        <div ref={line} className="relative mt-24">
          <div aria-hidden className="absolute inset-x-0 top-[calc(8rem+5px)] hidden h-px bg-ivoire/10 md:block" />
          <motion.div
            aria-hidden style={{ scaleX: draw }}
            className="absolute inset-x-0 top-[calc(8rem+5px)] hidden h-px origin-left bg-gradient-to-r from-or via-or-clair to-rouge md:block"
          />
          <ol className="relative grid grid-cols-2 gap-y-14 md:grid-cols-4">
            {stations.map((s, i) => (
              <Reveal as="li" key={i} delay={i * 0.15} className="pr-6">
                <div className="flex h-24 items-end md:h-32">
                  <span className="font-display text-[clamp(3rem,6vw,5.5rem)] font-medium leading-none text-or-clair">
                    <CountUp to={s.to} format={(n) => (s.plain ? String(n) : n.toLocaleString("fr-BE"))} />
                  </span>
                  {s.unit && <span className="mb-2 ml-2 font-display text-xl italic text-or">{s.unit}</span>}
                </div>
                <span aria-hidden className={`mt-0 block h-[11px] w-[11px] rotate-45 ${i === 3 ? "bg-rouge" : "bg-or"}`} />
                <p className="mt-6 max-w-[14rem] text-sm leading-relaxed text-ivoire/65">{s.label}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Trois axes, sans cartes : filets verticaux et chiffres romains */}
        <div className="mt-28 grid gap-12 md:grid-cols-3 md:gap-0">
          {axes.map((a, i) => (
            <Reveal key={i} delay={i * 0.12} className={`md:px-10 ${i > 0 ? "md:border-l md:border-ivoire/10" : "md:pl-0"}`}>
              <span className="font-caps text-sm tracking-[0.3em] text-rouge">{["I", "II", "III"][i]}</span>
              <h3 className="mt-4 font-display text-3xl">{a.title}</h3>
              <p className="mt-4 leading-relaxed text-ivoire/65"><Rich text={a.text} /></p>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <div className="mt-16 flex flex-wrap gap-x-8 gap-y-4">
            <CmfiLink href={CMFI.vision}>{t("home2.cmfi.vision")}</CmfiLink>
            <CmfiLink href={CMFI.history}>{t("home2.cmfi.history")}</CmfiLink>
            <CmfiLink href={CMFI.fiveYearGoal}>{t("home2.cmfi.fiveYearGoal")}</CmfiLink>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
