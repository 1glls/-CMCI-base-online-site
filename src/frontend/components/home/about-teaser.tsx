"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { CountUp, Reveal, WordsReveal } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"
import { Scripture } from "@/components/site/scripture"
import { CmfiLink } from "@/components/site/cmfi-link"
import { CMFI } from "@/lib/cmfi"

/**
 * Apercu « Mieux nous connaitre » de l'accueil : une accroche, les quatre
 * chiffres de la vision, et le chemin vers la page complete.
 */
export function AboutTeaser() {
  const { t } = useLanguage()
  const figures = [
    { to: 10, unit: t("home2.vision.billions"), label: t("home2.vision.people") },
    { to: 1, unit: t("home2.vision.billion"), label: t("home2.vision.disciples") },
    { to: 250, unit: "", label: t("home2.vision.nations") },
    { to: 2065, unit: "", label: t("home2.vision.deadline"), plain: true },
  ]

  return (
    <section id="vision" className="relative overflow-hidden bg-nuit py-28 text-ivoire md:py-32">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-rouge halo blur-[140px]" />
      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <Reveal>
            <span className="eyebrow flex items-center gap-3 text-or">
              <span className="h-px w-10 bg-or" aria-hidden />{t("home2.teaser.label")}
            </span>
          </Reveal>
          <h2 className="mt-6 font-display text-[clamp(2.4rem,4.8vw,4.4rem)] leading-[1.03]">
            <WordsReveal text={t("home2.teaser.title")} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivoire/70"><Rich text={t("home2.teaser.text")} /></p>
          </Reveal>
          <Reveal delay={0.3}>
            <Link href="/mieux-nous-connaitre" className="group mt-9 inline-flex items-center gap-3 border border-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-or-clair transition-colors hover:bg-or hover:text-nuit">
              {t("home2.teaser.cta")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Reveal>
        </div>

        {/* Chiffres de la vision, separes par des filets */}
        <div>
        <div className="grid grid-cols-2">
          {figures.map((f, i) => (
            <Reveal key={i} delay={i * 0.12} className={`p-6 md:p-8 ${i % 2 ? "border-l border-ivoire/10" : ""} ${i > 1 ? "border-t border-ivoire/10" : ""}`}>
              <div className="flex items-end">
                <span className="font-display text-[clamp(2.8rem,5vw,4.6rem)] font-medium leading-none text-or-clair">
                  <CountUp to={f.to} format={(n) => (f.plain ? String(n) : n.toLocaleString("fr-BE"))} />
                </span>
                {f.unit && <span className="mb-1.5 ml-2 font-display text-lg italic text-or">{f.unit}</span>}
              </div>
              <span aria-hidden className={`mt-4 block h-2 w-2 rotate-45 ${i === 3 ? "bg-rouge" : "bg-or"}`} />
              <p className="mt-3 text-sm text-ivoire/60">{f.label}</p>
            </Reveal>
          ))}
        </div>
          <Reveal delay={0.3} className="mt-8 px-6 md:px-8">
            <CmfiLink href={CMFI.vision}>{t("home2.cmfi.worldVision")}</CmfiLink>
          </Reveal>
        </div>
      </div>

      {/* « Allez, faites de toutes les nations des disciples » */}
      <div className="relative mx-auto mt-24 max-w-7xl px-6">
        <Scripture verse="mission" />
      </div>
    </section>
  )
}
