"use client"

import { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTiming } from "@/components/site/timing-provider"
import type { GalleryImage } from "@/components/home/gallery-teaser"


/**
 * Vue « Une par une » de la galerie : chaque photo en grand et entiere
 * (object-contain : rien n'est recadre), posee sur un reflet flou et fondu
 * d'elle-meme. Fleches, clavier (← →), glissement au doigt, lecture
 * automatique a la demande.
 */
export function GalleryOneByOne({ images }: { images: GalleryImage[] }) {
  // Duree reglable : Parametres → Rythmes et automatismes
  const AUTO_MS = useTiming("timing_gallery")
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [dir, setDir] = useState(1)
  const [playing, setPlaying] = useState(false)
  const n = images.length

  const go = useCallback((d: number) => {
    if (n < 2) return
    setDir(d)
    setIndex((i) => (i + d + n) % n)
  }, [n])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => go(1), AUTO_MS)
    return () => clearTimeout(id)
  }, [playing, index, go, AUTO_MS])

  if (n === 0) return <p className="py-20 text-center font-display text-2xl text-ivoire/60">{t("home2.pages.gallery.empty")}</p>
  const img = images[index]

  return (
    <div className="relative">
      <div className="relative h-[min(78vh,820px)] min-h-[420px] overflow-hidden">
        {/* Reflet flou de la photo, fondu dans le fond : pas de cadre visible */}
        <AnimatePresence initial={false}>
          <motion.img
            key={`bg-${img.id}`} aria-hidden src={getImageUrl(img.src)} alt=""
            className="fondu absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
            initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}
          />
        </AnimatePresence>

        {/* La photo, entiere ; glisser pour changer */}
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.img
            key={img.id}
            src={getImageUrl(img.src)} alt={img.alt || ""}
            custom={dir}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 120, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -120, scale: 0.97 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            drag={n > 1 ? "x" : false} dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25}
            onDragEnd={(_, info) => { if (info.offset.x < -80) go(1); else if (info.offset.x > 80) go(-1) }}
            className="relative mx-auto h-full w-full cursor-grab object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,.55)] active:cursor-grabbing"
          />
        </AnimatePresence>

        {n > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label={t("home2.pages.gallery.prev")} className="absolute left-2 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center border border-ivoire/30 bg-nuit/60 text-ivoire backdrop-blur transition-colors hover:border-or hover:text-or-clair md:left-6">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button onClick={() => go(1)} aria-label={t("home2.pages.gallery.next")} className="absolute right-2 top-1/2 grid h-14 w-14 -translate-y-1/2 place-items-center border border-ivoire/30 bg-nuit/60 text-ivoire backdrop-blur transition-colors hover:border-or hover:text-or-clair md:right-6">
              <ChevronRight className="h-7 w-7" />
            </button>
          </>
        )}
      </div>

      {/* Legende, compteur, lecture automatique */}
      <div className="mx-auto mt-8 flex max-w-5xl flex-wrap items-center justify-between gap-6 px-6">
        <div className="min-h-[3.5rem]">
          <AnimatePresence mode="wait">
            <motion.div key={img.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}>
              {img.category && <p className="eyebrow !text-[10px] text-or">{img.category}</p>}
              <p className="mt-1 font-display text-2xl text-ivoire md:text-3xl">{img.alt || t("home2.pages.gallery.title")}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-5">
          <span className="font-display text-2xl tabular-nums text-ivoire">
            {String(index + 1).padStart(2, "0")}<span className="text-ivoire/40"> / {String(n).padStart(2, "0")}</span>
          </span>
          {n > 1 && (
            <button
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center gap-2 border border-or/50 px-4 py-2.5 font-caps text-[11px] uppercase tracking-[0.18em] text-or-clair transition-colors hover:bg-or hover:text-nuit"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? t("home2.pages.gallery.pause") : t("home2.pages.gallery.play")}
            </button>
          )}
        </div>
      </div>
      {/* Progression dans la galerie */}
      <div aria-hidden className="mx-auto mt-6 h-px max-w-5xl bg-ivoire/15">
        <motion.div className="h-full bg-or" animate={{ width: `${((index + 1) / n) * 100}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  )
}
