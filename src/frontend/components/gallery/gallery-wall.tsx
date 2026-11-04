"use client"

import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { GalleryImage } from "@/components/home/gallery-teaser"

/**
 * Mur de photos de /galerie : colonnes a la maniere d'une mosaique, photos
 * fondues sur leurs bords, filtres par categorie (champ saisi dans l'admin
 * Galerie) et visionneuse plein ecran au clavier (fleches, Echap).
 */
export function GalleryWall({ images }: { images: GalleryImage[] }) {
  const { t } = useLanguage()
  const [category, setCategory] = useState<string | null>(null)
  const [index, setIndex] = useState<number | null>(null)

  const categories = useMemo(
    () => [...new Set(images.map((i) => i.category).filter(Boolean) as string[])],
    [images]
  )
  const shown = category ? images.filter((i) => i.category === category) : images
  const current = index !== null ? shown[index] : null
  const go = (d: number) => setIndex((i) => (i === null ? i : (i + d + shown.length) % shown.length))

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1)
      if (e.key === "ArrowLeft") go(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  if (images.length === 0) {
    return <p className="py-20 text-center font-display text-2xl text-ivoire/60">{t("home2.pages.gallery.empty")}</p>
  }

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {[null, ...categories].map((c) => (
            <button
              key={c ?? "all"} onClick={() => setCategory(c)}
              className={`border px-5 py-2 font-caps text-[11px] uppercase tracking-[0.2em] transition-colors ${category === c ? "border-or bg-or text-nuit" : "border-ivoire/25 text-ivoire/70 hover:border-or hover:text-or-clair"}`}
            >
              {c ?? t("home2.pages.gallery.all")}
            </button>
          ))}
        </div>
      )}

      <motion.div layout className="columns-1 gap-8 sm:columns-2 lg:columns-3">
        <AnimatePresence>
          {shown.map((img, i) => (
            <motion.button
              layout key={img.id} type="button" onClick={() => setIndex(i)}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7, delay: (i % 3) * 0.08 }}
              className="group mb-8 block w-full break-inside-avoid"
              aria-label={img.alt || t("home2.pages.gallery.title")}
            >
              <img
                src={getImageUrl(img.src)} alt={img.alt || ""} loading="lazy"
                className="fondu w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]"
              />
              {img.alt && <span className="mt-1 block text-center font-display text-lg italic text-ivoire/55 group-hover:text-or-clair">{img.alt}</span>}
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      <Dialog open={current !== null} onOpenChange={(o) => !o && setIndex(null)}>
        <DialogContent showCloseButton={false} className="max-w-[min(92vw,1200px)] border-none bg-transparent p-0 shadow-none sm:max-w-[min(92vw,1200px)]">
          {current && (
            <div className="relative">
              <DialogTitle className="sr-only">{current.alt || t("home2.pages.gallery.title")}</DialogTitle>
              <img src={getImageUrl(current.src)} alt={current.alt || ""} className="max-h-[82vh] w-full object-contain" />
              {current.alt && <p className="mt-4 text-center font-display text-xl text-ivoire">{current.alt}</p>}
              <button onClick={() => setIndex(null)} aria-label={t("home2.pages.gallery.close")} className="absolute -top-12 right-0 p-2 text-ivoire hover:text-or-clair">
                <X className="h-7 w-7" />
              </button>
              {shown.length > 1 && (
                <>
                  <button onClick={() => go(-1)} aria-label={t("home2.pages.gallery.prev")} className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-nuit/70 text-ivoire hover:text-or-clair">
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button onClick={() => go(1)} aria-label={t("home2.pages.gallery.next")} className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center bg-nuit/70 text-ivoire hover:text-or-clair">
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
