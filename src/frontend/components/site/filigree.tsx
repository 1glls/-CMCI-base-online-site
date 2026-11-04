"use client"

import { useLanguage } from "@/contexts/LanguageContext"
import { CircularText } from "./motion-kit"

/**
 * Filigrane decoratif pour habiller les grandes zones vides : texte geant en
 * contour or, croix fine ou anneau de texte tournant. Opacite pilotee par
 * --filigrane (plus marquee en mode clair, cf. app/globals.css).
 * A placer dans un parent `relative` ; `className` donne la position.
 */
export function Filigree({
  kind, text, className = "",
}: { kind: "text" | "cross" | "ring"; text?: string; className?: string }) {
  const { t } = useLanguage()
  const style = { opacity: "var(--filigrane)" } as React.CSSProperties
  if (kind === "text") {
    return (
      <span aria-hidden style={style} className={`pointer-events-none absolute select-none whitespace-nowrap font-display leading-none text-transparent [-webkit-text-stroke:1.5px_var(--or)] ${className}`}>
        {text}
      </span>
    )
  }
  if (kind === "cross") {
    return (
      <svg aria-hidden style={style} viewBox="0 0 100 160" className={`pointer-events-none absolute text-or ${className}`} fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M50 4V156M14 46H86" />
        <path d="M44 4H56M44 156H56M14 40V52M86 40V52" strokeWidth=".8" />
      </svg>
    )
  }
  return (
    <div aria-hidden style={style} className={`pointer-events-none absolute text-or ${className}`}>
      <CircularText text={t("home2.about.circular")} className="h-full w-full" />
    </div>
  )
}
