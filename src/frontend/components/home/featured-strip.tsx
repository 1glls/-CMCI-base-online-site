"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion } from "motion/react"
import { ArrowUpRight, Calendar, MapPin, Play } from "lucide-react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { Reveal, WordsReveal } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"
import type { Slide } from "./hero"
import { SocialAction, SocialBadge, SOCIAL_ICONS, isPlayable, mergeSocialSlides, useVideoPlayer, type SocialPost } from "./social-badge"
import { useTiming } from "@/components/site/timing-provider"

const FEATURED = 3
const EASE = [0.16, 1, 0.3, 1] as const
const FALLBACK = "/images/hero-worship.jpg"

/** Bouton d'action d'une annonce (texte et lien saisis dans l'admin Section Hero). */
function SlideLink({ s, big = false }: { s: Slide; big?: boolean }) {
  if (!s.buttonText || !s.buttonUrl) return null
  return (
    <a
      href={s.buttonUrl} target="_blank" rel="noopener noreferrer"
      className={big
        ? "mt-6 inline-flex items-center gap-2 bg-or px-6 py-3.5 font-caps text-[11px] uppercase tracking-[0.2em] text-nuit hover:bg-or-clair"
        : "mt-3 inline-flex items-center gap-1.5 border-b border-or pb-0.5 font-caps text-[10px] uppercase tracking-[0.2em] text-or-clair hover:text-ivoire"}
    >
      {s.buttonText} <ArrowUpRight className="h-3.5 w-3.5" />
    </a>
  )
}

/**
 * « A la une » (mode Message + livres) : au plus trois annonces vraiment
 * mises en avant (une grande, deux secondaires). Les autres restent dans
 * « Decouvrir aussi » : un clic sur l'une d'elles la fait passer en grand.
 * Defilement automatique : toutes les 7 s l'annonce suivante passe en grand
 * (pause au survol, au clavier et hors de l'ecran).
 * Les annonces sont les diapositives de l'admin « Section Hero », plus les
 * publications des reseaux validees dans l'admin (mention « Sur nos reseaux »),
 * la plus recente en premier (components/home/social-badge.tsx).
 * Duree d'affichage reglable : Parametres → Rythmes et automatismes.
 */
export function FeaturedStrip({ slides: baseSlides, posts = [], socialCount = 3 }: { slides: Slide[]; posts?: SocialPost[]; socialCount?: number }) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const AUTO_MS = useTiming("timing_featured")
  const player = useVideoPlayer()
  const slides = useMemo(() => mergeSocialSlides(baseSlides, posts, socialCount), [baseSlides, posts, socialCount])
  const [order, setOrder] = useState<string[]>(() => slides.map((s) => s.id))
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { amount: 0.3 })
  const [paused, setPaused] = useState(false)
  const auto = slides.length > 1 && inView && !paused && !reduce

  // Rotation : la grande annonce passe en fin de liste, la suivante prend sa place
  useEffect(() => {
    if (!auto) return
    const id = setTimeout(() => setOrder((prev) => [...prev.slice(1), prev[0]]), AUTO_MS)
    return () => clearTimeout(id)
  }, [auto, order])

  // Nouvelles donnees (changement de langue) : on garde l'ordre choisi si possible
  useEffect(() => {
    setOrder((prev) => {
      const ids = slides.map((s) => s.id)
      return [...prev.filter((id) => ids.includes(id)), ...ids.filter((id) => !prev.includes(id))]
    })
  }, [slides])

  const byId = new Map(slides.map((s) => [s.id, s]))
  const ordered = order.map((id) => byId.get(id)).filter(Boolean) as Slide[]
  if (ordered.length === 0) return null
  const [main, ...secondary] = ordered.slice(0, FEATURED)
  const rest = ordered.slice(FEATURED)

  const promote = (id: string) => {
    setOrder((prev) => [id, ...prev.filter((x) => x !== id)])
    document.getElementById("a-la-une")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
  }
  const layout = reduce ? undefined : ("position" as const)

  return (
    <section
      id="a-la-une" ref={sectionRef}
      className="relative scroll-mt-28 overflow-hidden bg-nuit py-24 text-ivoire md:py-28"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <span className="eyebrow flex items-center gap-3 text-or">
            <span className="h-1.5 w-1.5 rotate-45 bg-rouge" aria-hidden />{t("home2.featured.label")}
          </span>
        </Reveal>
        <h2 className="mt-4 font-display text-4xl md:text-5xl">
          <WordsReveal text={t("home2.featured.title")} />
        </h2>

        {main && (
        <LayoutGroup>
          <div className={`mt-12 grid gap-10 ${secondary.length ? "lg:grid-cols-[1.55fr_1fr]" : ""}`}>
            {/* Annonce principale */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.article
                key={main.id} layout={layout}
                initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: EASE }}
                className="group relative"
              >
                <div className="relative aspect-[4/3] overflow-hidden lg:aspect-[16/11]">
                  <img
                    src={getImageUrl(main.image, FALLBACK)} alt=""
                    className="fondu h-full w-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-[1.04]"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/30 to-transparent" />
                  {isPlayable(main.social) && (
                    <button
                      type="button" onClick={() => player.open(main)} aria-label={`${t("home2.featured.watch")} : ${main.title}`}
                      className="absolute inset-0 grid place-items-center"
                    >
                      <span className="grid h-20 w-20 place-items-center rounded-full border border-or/70 bg-nuit/50 text-or-clair backdrop-blur-sm transition-colors hover:bg-or hover:text-nuit">
                        <Play className="ml-1 h-8 w-8" />
                      </span>
                    </button>
                  )}
                </div>
                <div className="pointer-events-none relative -mt-36 px-2 md:-mt-44 md:px-8 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
                  {main.social && <SocialBadge social={main.social} className="mb-3" />}
                  {(main.linkedEvent?.date || main.linkedEvent?.location) && (
                    <p className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ivoire/70">
                      {main.linkedEvent?.date && <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-or" />{main.linkedEvent.date}</span>}
                      {main.linkedEvent?.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-or" />{main.linkedEvent.location}</span>}
                    </p>
                  )}
                  <h3 className="mt-3 font-display text-[clamp(2rem,4vw,3.4rem)] leading-[1.02]"><Rich text={main.title} /></h3>
                  <p className="mt-3 line-clamp-2 max-w-2xl text-ivoire/70"><Rich text={main.subtitle} /></p>
                  {main.social ? <div className="mt-6"><SocialAction social={main.social} big onPlay={() => player.open(main)} /></div> : <SlideLink s={main} big />}
                  {/* Temps restant avant l'annonce suivante */}
                  {slides.length > 1 && !reduce && (
                    <div aria-hidden className="mt-8 h-px w-full max-w-xs bg-ivoire/15">
                      <motion.div
                        key={`${main.id}-${auto}`}
                        className="h-full bg-or"
                        initial={{ width: "0%" }} animate={{ width: auto ? "100%" : "0%" }}
                        transition={{ duration: auto ? AUTO_MS / 1000 : 0.3, ease: "linear" }}
                      />
                    </div>
                  )}
                </div>
              </motion.article>
            </AnimatePresence>

            {/* Deux annonces secondaires */}
            {secondary.length > 0 && (
              <div className="flex flex-col gap-10">
                {secondary.map((s) => (
                  <motion.article
                    key={s.id} layout={layout}
                    initial={reduce ? false : { opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="group grid grid-cols-[42%_1fr] items-center gap-5"
                  >
                    <button type="button" onClick={() => promote(s.id)} aria-label={`${t("home2.featured.promote")} : ${s.title}`} className="relative aspect-[4/5] overflow-hidden">
                      <img src={getImageUrl(s.image, FALLBACK)} alt="" className="fondu h-full w-full scale-110 object-cover transition-transform duration-[1.2s] group-hover:scale-[1.16]" />
                    </button>
                    <div>
                      {s.social ? <SocialBadge social={s.social} className="!text-[9px]" /> : s.linkedEvent?.date && <p className="eyebrow !text-[9px] text-or">{s.linkedEvent.date}</p>}
                      <h3 className="mt-2 font-display text-2xl leading-tight">
                        <button type="button" onClick={() => promote(s.id)} className="text-left transition-colors hover:text-or-clair"><Rich text={s.title} /></button>
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-ivoire/60"><Rich text={s.subtitle} /></p>
                      {s.social ? <div className="mt-3"><SocialAction social={s.social} onPlay={() => player.open(s)} /></div> : <SlideLink s={s} />}
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </LayoutGroup>
        )}

        {/* Les autres annonces : discretes, mais toujours a portee */}
        {rest.length > 0 && (
          <div className="mt-16 border-t border-ivoire/10 pt-8">
            <p className="eyebrow !text-[10px] text-ivoire/50">{t("home2.featured.more")} ({rest.length})</p>
            <div className="mt-5 flex gap-6 overflow-x-auto pb-2 [scrollbar-color:var(--or)_transparent] [scrollbar-width:thin]">
              {rest.map((s) => (
                <button
                  key={s.id} type="button" onClick={() => promote(s.id)}
                  aria-label={`${t("home2.featured.promote")} : ${s.title}`}
                  className="group flex w-72 shrink-0 items-center gap-4 text-left"
                >
                  <img src={getImageUrl(s.image, FALLBACK)} alt="" className="fondu h-20 w-24 shrink-0 object-cover opacity-70 transition-opacity group-hover:opacity-100" />
                  <span>
                    <span className="line-clamp-2 font-display text-lg leading-snug text-ivoire/80 transition-colors group-hover:text-or-clair"><Rich text={s.title} /></span>
                    {s.social ? (() => { const Icon = SOCIAL_ICONS[s.social.platform]; return <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-or/80"><Icon className="h-3 w-3" />{t("home2.featured.social")}</span> })()
                      : s.linkedEvent?.date && <span className="mt-1 block text-[11px] text-ivoire/45">{s.linkedEvent.date}</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {player.dialog}
      </div>
    </section>
  )
}
