"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Globe } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

type Lang = "fr" | "en" | "nl"
const LANGS: { code: Lang; name: string }[] = [
  { code: "fr", name: "Français" },
  { code: "en", name: "English" },
  { code: "nl", name: "Nederlands" },
]

/**
 * Selecteur de langue de la charte « Nuit & or ».
 * - par defaut : menu deroulant (survol, clic, clavier, Echap) ;
 * - `inline` : trois choix cote a cote, pour le menu mobile plein ecran
 *   (pas de survol sur telephone).
 * Remplace LanguageSelector dans le nouvel en-tete ; l'ancien composant reste
 * en place pour l'ancien en-tete encore en ligne.
 */
export function LanguageSwitcher({ inline = false }: { inline?: boolean }) {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  // Fermeture au clic en dehors et a Echap
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey) }
  }, [open])

  const choose = (code: Lang) => { setLanguage(code); setOpen(false) }

  if (inline) {
    return (
      <div role="radiogroup" aria-label="Langue" className="flex items-center gap-1">
        <Globe className="mr-2 h-4 w-4 text-or" aria-hidden />
        {LANGS.map((l) => (
          <button
            key={l.code} role="radio" aria-checked={language === l.code} onClick={() => choose(l.code)}
            className={`px-3 py-2 font-caps text-xs uppercase tracking-[0.2em] transition-colors ${language === l.code ? "border-b border-or text-or-clair" : "border-b border-transparent text-ivoire/60 hover:text-ivoire"}`}
          >
            {l.code}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={root} className="relative"
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Langue"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-1 py-2 font-caps text-[11px] uppercase tracking-[0.22em] text-ivoire/85 transition-colors hover:text-or-clair"
      >
        <Globe className="h-4 w-4 text-or" aria-hidden />
        {language}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {/* pt-3 : pont invisible entre le bouton et le menu, le survol ne se perd pas */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 top-full z-50 w-52 pt-3"
          >
            <div className="relative border border-or/30 bg-nuit/95 py-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,.7)] backdrop-blur-md">
              {/* Filet or en tete, losange rouge pose sur le bouton */}
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-or to-transparent" />
              {LANGS.map((l) => {
                const active = language === l.code
                return (
                  <button
                    key={l.code} role="menuitemradio" aria-checked={active} onClick={() => choose(l.code)}
                    className={`group flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-or/10 ${active ? "bg-or/10" : ""}`}
                  >
                    <span className={`w-6 font-caps text-[11px] uppercase tracking-[0.18em] ${active ? "text-or-clair" : "text-or"}`}>{l.code}</span>
                    <span className={`flex-1 font-display text-xl leading-none ${active ? "text-ivoire" : "text-ivoire/75 group-hover:text-ivoire"}`}>{l.name}</span>
                    {active && <span aria-hidden className="h-2 w-2 rotate-45 bg-rouge" />}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
