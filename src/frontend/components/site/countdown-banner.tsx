"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, ChevronDown, ExternalLink, MapPin, Clock, X } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useTiming } from "@/components/site/timing-provider"
import { type Countdown, phaseOf, progressOf, remaining, targetOf, visibleUnits } from "@/lib/countdown"

const HIDE_KEY = "cmciCountdownBannerHidden"
/** Intervalle entre deux « appels » visuels du bandeau (reflet, pulsation). */
const FLASH_MS = 10000

/** Heure courante, rafraichie chaque seconde ; null tant que la page n'est pas montee (evite un ecart serveur/client). */
export function useNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/**
 * Bandeau fin en haut des pages : decompte de l'evenement en cours ou a
 * venir, infos pratiques depliables. Plusieurs comptes : rotation toutes les 8 s.
 */
export function CountdownBanner({ countdowns }: { countdowns: Countdown[] }) {
  const rotateEvery = useTiming("timing_countdown_banner")
  const { t } = useLanguage()
  const now = useNow()
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const [hidden, setHidden] = useState(false)
  const reduce = useReducedMotion()
  // Compteur d'appels : chaque increment rejoue le reflet et la pulsation
  const [flash, setFlash] = useState(0)

  useEffect(() => {
    if (reduce) return
    const first = setTimeout(() => setFlash(1), 2500)
    const id = setInterval(() => setFlash((f) => f + 1), FLASH_MS)
    return () => { clearTimeout(first); clearInterval(id) }
  }, [reduce])

  const live = countdowns.filter((c) => c.showBanner && (!now || phaseOf(c, now) !== "ended"))
  const signature = live.map((c) => c.id).join(",")

  useEffect(() => {
    try { setHidden(sessionStorage.getItem(HIDE_KEY) === signature) } catch { /* stockage indisponible */ }
  }, [signature])

  useEffect(() => {
    if (live.length < 2 || open) return
    const id = setInterval(() => setIndex((i) => (i + 1) % live.length), rotateEvery)
    return () => clearInterval(id)
  }, [live.length, open, rotateEvery])

  if (live.length === 0 || hidden) return null
  const c = live[index % live.length]
  const phase = now ? phaseOf(c, now) : "upcoming"
  const r = now ? remaining(targetOf(c, now), now) : null
  const units = r ? visibleUnits(r).slice(0, 4) : []

  const hide = () => {
    try { sessionStorage.setItem(HIDE_KEY, signature) } catch { /* stockage indisponible */ }
    setHidden(true)
  }

  return (
    <div className="relative overflow-hidden border-y border-or/50 bg-[linear-gradient(90deg,var(--banner-edge)_0%,var(--nuit)_30%,var(--nuit)_70%,var(--banner-edge)_100%)] text-ivoire">
      {/* Reflet dore qui balaie le bandeau a chaque appel */}
      {flash > 0 && (
        <motion.span
          key={flash}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-or/35 to-transparent"
          initial={{ x: "-120%" }} animate={{ x: "420%" }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
        />
      )}
      <div className="relative mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:gap-5">
        <motion.span
          key={`d${flash}`}
          aria-hidden
          className="hidden h-2.5 w-2.5 shrink-0 rotate-45 bg-rouge sm:block"
          initial={false}
          animate={flash > 0 ? { scale: [1, 1.9, 1], boxShadow: ["0 0 0 0 rgba(239,51,64,0)", "0 0 0 8px rgba(239,51,64,.35)", "0 0 0 0 rgba(239,51,64,0)"] } : {}}
          transition={{ duration: 1.2 }}
        />
        <AnimatePresence mode="wait">
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1"
          >
            <motion.span
              key={`t${flash}`}
              className="eyebrow truncate !text-[10px] font-semibold text-or-clair sm:!text-[11px]"
              initial={false}
              animate={flash > 0 ? { textShadow: ["0 0 0 rgba(255,216,102,0)", "0 0 14px rgba(255,216,102,.9)", "0 0 0 rgba(255,216,102,0)"] } : {}}
              transition={{ duration: 1.6 }}
            >
              {c.title}
            </motion.span>
            <span className="hidden text-xs text-ivoire/60 md:inline">
              {phase === "running" ? t("home2.countdown.running") : t("home2.countdown.startsIn")}
            </span>
            <span className="flex items-baseline gap-2 font-display text-base tabular-nums text-ivoire sm:text-lg" aria-live="off">
              {r
                ? units.map((u) => (
                    <span key={u}>
                      {String(r[u]).padStart(2, "0")}
                      <span className="ml-0.5 font-sans text-[10px] text-ivoire/55">{t(`home2.countdown.units.${u}`)}</span>
                    </span>
                  ))
                : <span className="text-ivoire/40">— —</span>}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Toujours present : au minimum le lien vers la page Temps forts */}
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex shrink-0 items-center gap-1 rounded-full border border-or/40 px-3 py-1 text-[11px] font-semibold text-or-clair transition-colors hover:bg-or hover:text-nuit"
        >
          {t("home2.countdown.info")}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button onClick={hide} aria-label={t("home2.countdown.hide")} className="shrink-0 p-1 text-ivoire/50 hover:text-ivoire">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Avancement de la periode : filet or, pointe rouge */}
      {phase === "running" && now && (
        <div className="absolute inset-x-0 bottom-0 h-[2px] bg-ivoire/10">
          <div className="relative h-full bg-or" style={{ width: `${progressOf(c, now) * 100}%` }}>
            <span className="absolute -right-0.5 -top-[3px] h-2 w-2 rotate-45 bg-rouge" />
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-or/15 bg-charbon"
          >
            <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 text-sm text-ivoire/80 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-start">
              {c.location && (
                <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-or" />{c.location}</p>
              )}
              {c.schedule && (
                <p className="flex gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-or" />{c.schedule}</p>
              )}
              {c.info && <p className="whitespace-pre-line">{c.info}</p>}
              <div className="flex flex-wrap items-center gap-3 self-center">
                {c.linkUrl && (
                  <a
                    href={c.linkUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-or px-4 py-1.5 text-xs font-semibold text-nuit hover:bg-or-clair"
                  >
                    {c.linkLabel || t("home2.countdown.more")} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <Link href="/temps-forts" className="inline-flex items-center gap-1.5 text-xs font-semibold text-or-clair hover:text-ivoire">
                  {t("home2.countdown.allEvents")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
