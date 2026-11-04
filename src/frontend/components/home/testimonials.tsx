"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useLocalizedData } from "@/hooks/use-localized-data"
import { Reveal } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"
import { Filigree } from "@/components/site/filigree"
import { getImageUrl } from "@/lib/api"

export interface Testimonial {
  id: string
  name: string
  role: string | null
  quote: string
  /** Photo envoyee dans l'admin Temoignages (chemin /uploads/…, /images/… ou URL) */
  image?: string | null
}

/**
 * Portrait du temoin, fondu sur tous les bords (.fondu) : aucun cadre
 * visible, quelle que soit la forme de la photo (portrait, paysage, petite
 * image). Sans photo, une grande initiale en Garamond tient la meme place,
 * pour que la mise en page ne change pas d'un temoignage a l'autre.
 */
function Portrait({ name, image }: { name: string; image?: string | null }) {
  return (
    <div className="relative mx-auto h-72 w-64 shrink-0 md:h-[26rem] md:w-80">
      <div aria-hidden className="absolute inset-[-12%] rounded-full bg-or halo blur-3xl" />
      {image ? (
        <img
          src={getImageUrl(image)} alt={name}
          className="fondu relative h-full w-full scale-110 object-cover object-top"
        />
      ) : (
        <span aria-hidden className="fondu relative grid h-full w-full place-items-center font-display text-[9rem] leading-none text-or/40">
          {name.trim().charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}

/**
 * Un temoignage a la fois : portrait fondu a gauche (si une photo a ete
 * ajoutee dans l'admin), grande citation a droite, guillemets or geants,
 * fondu enchaine d'un temoignage a l'autre.
 */
export function Testimonials({ initial }: { initial: Testimonial[] }) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const data = useLocalizedData<Testimonial[]>("/api/testimonials", initial)
  const list = Array.isArray(data) ? data : []
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (list.length < 2 || paused || reduce) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % list.length), 7000)
    return () => clearTimeout(id)
  }, [index, list.length, paused, reduce])

  if (list.length === 0) return null
  const item = list[index % list.length]

  return (
    <section
      id="temoignages"
      className="relative overflow-hidden bg-[linear-gradient(to_bottom,var(--nuit),var(--charbon)_35%,var(--charbon)_65%,var(--nuit))] py-28 text-ivoire md:py-40"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    >
      <span aria-hidden className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 select-none font-display text-[22rem] leading-none text-or/10">“</span>
      <Filigree kind="ring" className="-left-24 top-1/2 hidden h-96 w-96 -translate-y-1/2 lg:block" />
      <Filigree kind="ring" className="-right-24 top-1/3 hidden h-72 w-72 lg:block" />
      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <span className="eyebrow inline-flex items-center gap-3 text-or">
            <span className="h-1.5 w-1.5 rotate-45 bg-rouge" aria-hidden />{t("home2.testimonials.label")}
          </span>
          <h2 className="mt-4 font-display text-3xl text-ivoire/80 md:text-4xl">{t("home2.testimonials.title")}</h2>
        </Reveal>

        <div className="relative mt-14 min-h-[26rem]">
          <AnimatePresence mode="wait">
            <motion.figure
              key={item.id}
              className="grid items-center gap-10 md:grid-cols-[auto_1fr] md:gap-16 md:text-left"
              initial={reduce ? false : { opacity: 0, y: 24, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              <Portrait name={item.name} image={item.image} />
              <div>
                <blockquote className="font-display text-[clamp(1.5rem,2.8vw,2.3rem)] italic leading-snug text-ivoire">
                  «&nbsp;<Rich text={item.quote} />&nbsp;»
                </blockquote>
                <figcaption className="mt-8 flex flex-col items-center md:items-start">
                  <span aria-hidden className="mb-4 block h-px w-12 bg-rouge" />
                  <span className="block font-display text-2xl text-or-clair">{item.name}</span>
                  {item.role && <span className="eyebrow mt-2 block !text-[10px] text-ivoire/50">{item.role}</span>}
                </figcaption>
              </div>
            </motion.figure>
          </AnimatePresence>
        </div>

        {list.length > 1 && (
          <div className="mt-10 flex justify-center gap-3">
            {list.map((x, i) => (
              <button
                key={x.id} onClick={() => setIndex(i)} aria-label={`${t("testimonials.goToTestimonial")} ${i + 1}`}
                className={`h-2.5 w-2.5 rotate-45 transition-colors ${i === index % list.length ? "bg-or" : "border border-ivoire/40 hover:border-or"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
