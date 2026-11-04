"use client"

import { useState } from "react"
import { GalleryHorizontalEnd, LayoutGrid } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import type { GalleryImage } from "@/components/home/gallery-teaser"
import { GalleryOneByOne } from "./gallery-one-by-one"
import { GalleryWall } from "./gallery-wall"

export type GalleryView = "une" | "catalogue"

/**
 * Les deux facons de parcourir la galerie, au choix du visiteur :
 * « Une par une » (chaque photo en grand) ou « Catalogue » (mosaique avec
 * filtres). Le selecteur reste visible pendant le defilement ; le choix est
 * garde dans l'adresse (?vue=catalogue) pour pouvoir etre partage.
 */
export function GalleryViews({ images, initialView }: { images: GalleryImage[]; initialView: GalleryView }) {
  const { t } = useLanguage()
  const [view, setView] = useState<GalleryView>(initialView)

  const choose = (v: GalleryView) => {
    setView(v)
    const url = new URL(window.location.href)
    if (v === "catalogue") url.searchParams.set("vue", "catalogue")
    else url.searchParams.delete("vue")
    window.history.replaceState({}, "", url)
  }

  const options: { value: GalleryView; label: string; hint: string; Icon: typeof LayoutGrid }[] = [
    { value: "une", label: t("home2.pages.gallery.oneByOne"), hint: t("home2.pages.gallery.oneByOneHint"), Icon: GalleryHorizontalEnd },
    { value: "catalogue", label: t("home2.pages.gallery.catalogue"), hint: t("home2.pages.gallery.catalogueHint"), Icon: LayoutGrid },
  ]

  return (
    <div>
      {/* Selecteur de vue, colle sous l'en-tete pendant le defilement */}
      <div className="sticky top-[8.5rem] z-30 mb-12 flex justify-center px-6">
        <div role="tablist" aria-label={t("home2.pages.gallery.viewLabel")} className="flex border border-or/50 bg-nuit/85 p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,.6)] backdrop-blur">
          {options.map(({ value, label, hint, Icon }) => {
            const active = view === value
            return (
              <button
                key={value} role="tab" aria-selected={active} onClick={() => choose(value)}
                className={`flex items-center gap-3 px-5 py-3 text-left transition-colors md:px-7 ${active ? "bg-or text-nuit" : "text-ivoire/75 hover:text-or-clair"}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>
                  <span className="block font-caps text-xs uppercase tracking-[0.2em] md:text-[13px]">{label}</span>
                  <span className={`hidden text-[13px] sm:block ${active ? "text-nuit/80" : "text-ivoire/70"}`}>{hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {view === "une"
        ? <GalleryOneByOne images={images} />
        : <div className="mx-auto max-w-7xl px-6"><GalleryWall images={images} /></div>}
    </div>
  )
}
