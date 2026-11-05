"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react"
import { ArrowRight, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { useLocalizedData } from "@/hooks/use-localized-data"
import { CircularText, WordsReveal } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"
import { Logo } from "@/components/site/logo"
import { BookFan, type HeroBook } from "./book-fan"
import { SocialAction, SocialBadge, mergeSocialSlides, useVideoPlayer, type SlideSocial, type SocialPost } from "./social-badge"
import { useTiming } from "@/components/site/timing-provider"

export interface Slide {
  id: string
  title: string
  subtitle: string
  image: string | null
  imageMobile: string | null
  buttonText?: string | null
  buttonUrl?: string | null
  linkedEvent?: { date: string; time: string; location: string } | null
  /** Publication d'un reseau social affichee comme annonce (components/home/social-badge.tsx). */
  social?: SlideSocial | null
}

export type HeroMode = "livres" | "diaporama"

const EASE = [0.16, 1, 0.3, 1] as const
const FALLBACK_IMAGE = "/images/hero-worship.jpg"

/** Le h1 porte le nom officiel (SEO) et la devise, quel que soit le mode. */
function HeroHeading({ className = "" }: { className?: string }) {
  const { t } = useLanguage()
  const title = t("home2.hero.title")
  const [first, ...rest] = title.split(", ")
  return (
    <h1 className={className}>
      <span className="eyebrow mb-6 flex items-center gap-3 text-or-clair">
        <span className="h-px w-10 bg-or" aria-hidden />
        {t("home2.hero.eyebrow")}
      </span>
      <span className="block font-display text-[clamp(2.8rem,6.6vw,6.2rem)] font-medium leading-[0.98] text-ivoire">
        <WordsReveal text={rest.length ? `${first},` : first} />
        {rest.length > 0 && (
          <span className="block italic text-or-clair">
            <WordsReveal text={rest.join(", ")} delay={0.25} />
          </span>
        )}
      </span>
    </h1>
  )
}

function ScrollCue() {
  const { t } = useLanguage()
  return (
    <div className="pointer-events-none absolute bottom-8 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex">
      <span className="eyebrow !text-[9px] text-ivoire/50">{t("home2.hero.scroll")}</span>
      <span className="relative h-14 w-px overflow-hidden bg-ivoire/15">
        <motion.span
          className="absolute inset-x-0 top-0 h-1/2 bg-or"
          animate={{ y: ["-100%", "200%"] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </span>
    </div>
  )
}

/** Mode « Message + livres » : devise, verset d'appel, eventail des livres choisis. */
function HeroLivres({ slides, books }: { slides: Slide[]; books: HeroBook[] }) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const bgY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "22%"])
  const bgScale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.08, 1.2])
  const contentY = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["0%", "-18%"])
  const bg = getImageUrl(slides[0]?.image, FALLBACK_IMAGE)

  return (
    <section id="accueil" ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden bg-nuit pb-24 pt-40">
      <motion.div aria-hidden className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
        <img src={bg} alt="" className="photo-fond h-full w-full object-cover" />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-nuit via-nuit/85 to-nuit/30" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-nuit via-nuit/70 to-transparent" />
      <div aria-hidden className="absolute right-[8%] top-1/3 h-[38rem] w-[38rem] rounded-full bg-or halo blur-[120px]" />

      <motion.div style={{ y: contentY }} className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <HeroHeading />
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.7, ease: EASE }}
            className="mt-8 max-w-xl text-lg leading-relaxed text-ivoire/75"
          >
            <Rich text={t("home2.hero.lead")} />
          </motion.p>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: EASE }}
            className="mt-10 flex flex-wrap gap-4"
          >
            <a href="#evenements" className="group inline-flex items-center gap-3 bg-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-nuit transition-colors hover:bg-or-clair">
              {t("home2.hero.agenda")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <Link href="/livres" className="inline-flex items-center gap-3 border border-ivoire/40 px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-ivoire transition-colors hover:border-or hover:text-or-clair">
              {t("home2.hero.library")}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.3, delay: 0.4, ease: EASE }}
          className="flex flex-col items-center"
        >
          {books.length > 0 ? (
            <>
              <span className="eyebrow mb-10 flex items-center gap-3 !text-[10px] text-ivoire/60">
                <span className="h-1.5 w-1.5 rotate-45 bg-rouge" aria-hidden />{t("home2.hero.booksLabel")}
              </span>
              <BookFan books={books} />
            </>
          ) : (
            // Sans livre choisi : le logo dans son anneau de texte tournant
            <div className="relative h-72 w-72 text-or-clair/80">
              <CircularText text={t("home2.about.circular")} className="absolute inset-0 h-full w-full" />
              <Logo className="absolute inset-[22%] h-[56%] w-[56%] object-contain" />
            </div>
          )}
        </motion.div>
      </motion.div>
      <ScrollCue />
    </section>
  )
}

/** Mode « Diaporama + livres » : slides plein ecran, puis une slide Bibliotheque. */
function HeroDiaporama({ slides, books }: { slides: Slide[]; books: HeroBook[] }) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  // Duree d'une diapositive : Parametres → Rythmes et automatismes
  const SLIDE_MS = useTiming("timing_hero_slide")
  const player = useVideoPlayer()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = slides.length + (books.length > 0 ? 1 : 0)
  const isLibrary = books.length > 0 && index === slides.length
  const slide = isLibrary ? null : slides[index]

  useEffect(() => {
    if (total < 2 || paused) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % total), SLIDE_MS)
    return () => clearTimeout(id)
  }, [index, total, paused, SLIDE_MS])

  const go = (d: number) => setIndex((i) => (i + d + total) % total)

  return (
    <section
      id="accueil"
      className="relative flex min-h-[100svh] items-end overflow-hidden bg-nuit pb-28 pt-40"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={isLibrary ? "library" : slide?.id ?? "fallback"}
          aria-hidden className="absolute inset-0"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        >
          {isLibrary ? (
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_40%,rgba(212,167,58,0.22),transparent_70%)]" />
          ) : (
            <motion.picture
              className="absolute inset-0 block"
              initial={reduce ? false : { scale: 1.14 }} animate={{ scale: 1 }}
              transition={{ duration: SLIDE_MS / 1000 + 1.5, ease: "linear" }}
            >
              {slide?.imageMobile && <source media="(max-width: 767px)" srcSet={getImageUrl(slide.imageMobile)} />}
              <img src={getImageUrl(slide?.image, FALLBACK_IMAGE)} alt="" className="h-full w-full object-cover opacity-70" />
            </motion.picture>
          )}
        </motion.div>
      </AnimatePresence>
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-nuit via-nuit/60 to-nuit/20" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <HeroHeading className="sr-only" />
        <span className="eyebrow mb-6 flex items-center gap-3 text-or-clair" aria-hidden>
          <span className="h-px w-10 bg-or" />{t("home2.hero.eyebrow")}
        </span>

        <AnimatePresence mode="wait">
          <motion.div
            key={isLibrary ? "library" : slide?.id ?? "fallback"}
            initial={reduce ? false : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: EASE }}
            className={isLibrary ? "grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]" : ""}
          >
            <div className="max-w-3xl">
              {!isLibrary && slide?.social && <SocialBadge social={slide.social} className="mb-5" />}
              <h2 className="font-display text-[clamp(2.6rem,6vw,5.6rem)] font-medium leading-[1] text-ivoire">
                <Rich text={isLibrary ? t("home2.hero.librarySlideTitle") : slide?.title ?? t("home2.hero.title")} />
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ivoire/75">
                <Rich text={isLibrary ? t("home2.hero.librarySlideText") : slide?.subtitle ?? t("home2.hero.lead")} />
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                {isLibrary ? (
                  <Link href="/livres" className="inline-flex items-center gap-3 bg-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-nuit hover:bg-or-clair">
                    {t("home2.hero.library")} <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : slide?.social ? (
                  <SocialAction social={slide.social} big onPlay={() => player.open(slide)} />
                ) : slide?.buttonText && slide.buttonUrl ? (
                  <a href={slide.buttonUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-nuit hover:bg-or-clair">
                    {slide.buttonText} <ExternalLink className="h-4 w-4" />
                  </a>
                ) : (
                  <a href="#evenements" className="inline-flex items-center gap-3 bg-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-nuit hover:bg-or-clair">
                    {t("home2.hero.agenda")} <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
            {isLibrary && <BookFan books={books} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation : numero, barres de progression or, fleches */}
        {total > 1 && (
          <div className="mt-14 flex items-center gap-6">
            <span className="font-display text-xl tabular-nums text-ivoire">
              {String(index + 1).padStart(2, "0")}<span className="text-ivoire/40"> / {String(total).padStart(2, "0")}</span>
            </span>
            <div className="flex flex-1 gap-2">
              {Array.from({ length: total }).map((_, i) => (
                <button key={i} onClick={() => setIndex(i)} aria-label={`${i + 1}`} className="relative h-[3px] flex-1 overflow-hidden bg-ivoire/15">
                  {i < index && <span className="absolute inset-0 bg-or/70" />}
                  {i === index && (
                    <motion.span
                      key={`${index}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-or"
                      initial={{ width: "0%" }} animate={{ width: paused ? "0%" : "100%" }}
                      transition={{ duration: paused ? 0 : SLIDE_MS / 1000, ease: "linear" }}
                    />
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => go(-1)} aria-label={t("home2.hero.prev")} className="grid h-11 w-11 place-items-center border border-ivoire/30 text-ivoire hover:border-or hover:text-or-clair">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => go(1)} aria-label={t("home2.hero.next")} className="grid h-11 w-11 place-items-center border border-ivoire/30 text-ivoire hover:border-or hover:text-or-clair">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      {player.dialog}
    </section>
  )
}

export function Hero({ mode, initialSlides, books, posts = [], socialCount = 3 }: {
  mode: HeroMode
  initialSlides: Slide[]
  books: HeroBook[]
  /** Publications des reseaux validees : en mode Diaporama, elles rejoignent les diapositives. */
  posts?: SocialPost[]
  socialCount?: number
}) {
  const slides = useLocalizedData<Slide[]>("/api/hero", initialSlides)
  const list = Array.isArray(slides) ? slides : []
  return mode === "diaporama"
    ? <HeroDiaporama slides={mergeSocialSlides(list, posts, socialCount)} books={books} />
    : <HeroLivres slides={list} books={books} />
}
