"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { useLocalizedData } from "@/hooks/use-localized-data"
import { Reveal, WordsReveal } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"

export interface Ministry {
  id: string
  title: string
  description: string
  image: string | null
  link: string | null
}

/**
 * Ministeres en grandes lignes editoriales sur une image de fond plein
 * cadre, sans bord : elle s'efface vers la gauche et vers le bas (.fondu-fond)
 * et change en fondu enchaine selon le ministere survole (ordinateur) ou
 * visible a l'ecran (mobile).
 */
export function Ministries({ initial }: { initial: Ministry[] }) {
  const { t } = useLanguage()
  const data = useLocalizedData<Ministry[]>("/api/ministries", initial)
  const list = Array.isArray(data) ? data : []
  const [activeId, setActiveId] = useState<string | null>(null)

  if (list.length === 0) return null
  const active = list.find((m) => m.id === activeId) ?? list.find((m) => m.image) ?? list[0]

  return (
    <section id="ministeres" className="relative overflow-hidden bg-nuit py-28 text-ivoire md:py-36">
      {/* Fond : image du ministere actif, fondue dans le noir */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <AnimatePresence>
          {active?.image && (
            <motion.div
              key={active.id}
              className="absolute inset-y-0 right-0 h-full w-full md:w-[75%]"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* .photo-fond : plus marquee en mode clair */}
              <img src={getImageUrl(active.image)} alt="" loading="lazy" decoding="async" className="fondu-fond photo-fond h-full w-full object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-nuit via-nuit/70 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-nuit to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-nuit to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="eyebrow flex items-center gap-3 text-or">
            <span className="h-px w-10 bg-or" aria-hidden />{t("home2.ministries.label")}
          </span>
        </Reveal>
        <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.02]">
          <WordsReveal text={t("home2.ministries.title")} />
        </h2>

        <ol className="mt-16" onMouseLeave={() => setActiveId(null)}>
          {list.map((m, i) => (
            <Reveal as="li" key={m.id} delay={i * 0.06} className="border-t border-ivoire/12 last:border-b">
              <motion.div
                onMouseEnter={() => setActiveId(m.id)}
                onFocus={() => setActiveId(m.id)}
                // Sur mobile (pas de survol), le ministere au centre de l'ecran prend le fond
                onViewportEnter={() => { if (window.matchMedia("(hover: none)").matches) setActiveId(m.id) }}
                viewport={{ margin: "-45% 0px -45% 0px" }}
                tabIndex={0}
                className="group grid grid-cols-[auto_1fr] items-start gap-x-6 gap-y-3 py-9 outline-none md:grid-cols-[5rem_1.1fr_1fr_auto] md:items-center md:gap-x-10"
              >
                <span className={`font-caps text-sm tracking-[0.25em] transition-colors ${active?.id === m.id ? "text-rouge" : "text-or"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className={`font-display text-3xl leading-tight transition-all duration-500 md:text-[2.6rem] ${active?.id === m.id && activeId ? "translate-x-3 text-or-clair" : ""}`}>
                  <Rich text={m.title} />
                </h3>
                <p className="col-span-2 line-clamp-3 text-sm leading-relaxed text-ivoire/65 md:col-span-1"><Rich text={m.description} /></p>
                <ArrowUpRight className={`hidden h-7 w-7 transition-all duration-500 md:block ${active?.id === m.id && activeId ? "rotate-45 text-or" : "text-ivoire/30"}`} />
              </motion.div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
