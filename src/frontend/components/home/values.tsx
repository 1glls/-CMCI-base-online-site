"use client"

import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Reveal, WordsReveal } from "@/components/site/motion-kit"
import { SectionArch } from "@/components/site/section-arch"
import { Rich } from "@/components/site/rich-text"
import { CMFI } from "@/lib/cmfi"
import { ArrowUpRight } from "lucide-react"

const LETTERS = [
  { letter: "C", key: "community" },
  { letter: "M", key: "missionary" },
  { letter: "C", key: "christian" },
  { letter: "I", key: "international" },
]

/** Lettre geante en contour or qui se remplit d'encre au defilement. */
function FillingLetter({ letter, index }: { letter: string; index: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "start 35%"] })
  const fill = useTransform(scrollYProgress, [index * 0.08, 0.7 + index * 0.08], reduce ? [0, 0] : [100, 0])
  const clip = useTransform(fill, (f) => `inset(${f}% 0 0 0)`)
  return (
    <span ref={ref} aria-hidden className="relative block font-display text-[clamp(7rem,13vw,12rem)] font-semibold leading-[0.85]">
      {/* --heat (0 → 1) : proximite du curseur, fait virer l'or et l'encre au rouge */}
      <span className="block text-transparent transition-[-webkit-text-stroke-color] duration-300 [-webkit-text-stroke:1.5px_color-mix(in_srgb,var(--rouge)_calc(var(--heat)*100%),#b8902c)]">{letter}</span>
      <motion.span style={{ clipPath: clip }} className="absolute inset-0 block text-[color-mix(in_srgb,var(--rouge)_calc(var(--heat)*100%),var(--nuit))] transition-colors duration-300">{letter}</motion.span>
    </span>
  )
}

/** Distance (px) a partir de laquelle une colonne ne reagit plus au curseur. */
const HEAT_RADIUS = 160

/**
 * Valeurs C·M·C·I sur ivoire : quatre colonnes typographiques, sans fond ni
 * cadre. Les arches ouvrent et referment la section claire. Plus le curseur
 * approche d'une colonne, plus sa lettre et son texte virent au rouge vif.
 */
export function Values() {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const cols = useRef<(HTMLDivElement | null)[]>([])
  const frame = useRef(0)

  // Variable CSS --heat posee directement sur chaque colonne : pas de rendu
  // React a chaque mouvement de souris, la transition se fait en CSS.
  const onMove = (e: React.MouseEvent) => {
    if (reduce) return
    const { clientX: x, clientY: y } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      for (const el of cols.current) {
        if (!el) continue
        const r = el.getBoundingClientRect()
        const dx = Math.max(r.left - x, 0, x - r.right)
        const dy = Math.max(r.top - y, 0, y - r.bottom)
        const heat = Math.max(0, 1 - Math.hypot(dx, dy) / HEAT_RADIUS)
        el.style.setProperty("--heat", heat.toFixed(3))
      }
    })
  }
  const onLeave = () => {
    cancelAnimationFrame(frame.current)
    for (const el of cols.current) el?.style.setProperty("--heat", "0")
  }

  return (
    <section id="valeurs" className="relative bg-nuit">
      <SectionArch fill="var(--ivoire)" />
      <div className="bg-ivoire pb-16 pt-12 text-nuit">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="eyebrow inline-flex items-center gap-3 text-[#9a7420]">
                <span className="h-1.5 w-1.5 rotate-45 bg-rouge" aria-hidden />{t("home2.values.label")}
              </span>
            </Reveal>
            <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.02]">
              <WordsReveal text={t("home2.values.title")} />
            </h2>
            <Reveal delay={0.2}>
              <p className="mt-5 font-display text-xl italic text-nuit/60">{t("home2.values.subtitle")}</p>
            </Reveal>
          </div>

          <div className="mt-20 grid gap-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0" onMouseMove={onMove} onMouseLeave={onLeave}>
            {LETTERS.map((v, i) => (
              <Reveal key={v.key} delay={i * 0.1} className={`lg:px-8 ${i > 0 ? "lg:border-l lg:border-nuit/15" : "lg:pl-0"}`}>
                <div ref={(el) => { cols.current[i] = el }} className="heat">
                  <FillingLetter letter={v.letter} index={i} />
                  <span aria-hidden className="mt-6 block h-px bg-rouge transition-[width] duration-300 [width:calc(3rem_+_var(--heat)*4rem)]" />
                  <h3 className="mt-6 font-display text-3xl text-[color-mix(in_srgb,var(--rouge)_calc(var(--heat)*100%),var(--nuit))] transition-colors duration-300">
                    {t(`values.${v.key}.title`)}
                  </h3>
                  <p className="mt-3 leading-relaxed text-[color-mix(in_srgb,var(--rouge)_calc(var(--heat)*100%),color-mix(in_srgb,var(--nuit)_65%,transparent))] transition-colors duration-300">
                    <Rich text={t(`values.${v.key}.description`)} />
                  </p>
                  {v.key === "international" && (
                    <a href={CMFI.ministry} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 border-b border-[#b8902c]/60 pb-0.5 font-caps text-[10px] uppercase tracking-[0.18em] text-[#9a7420] hover:text-rouge">
                      {t("home2.cmfi.inTheWorld")} <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <SectionArch fill="var(--ivoire)" flip />
    </section>
  )
}
