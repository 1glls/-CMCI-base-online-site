"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowLeft, ArrowRight, ArrowUpRight, ChevronsLeftRight, Clock, MapPin, Repeat } from "lucide-react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { useLocalizedData } from "@/hooks/use-localized-data"
import { splitEvents } from "@/lib/event-date"
import { Reveal, WordsReveal } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"

export interface EventItem {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  image: string | null
  registrationUrl?: string | null
  registrationButtonText?: string | null
  exploreUrl?: string | null
  exploreButtonText?: string | null
}

type Dated = { e: EventItem; d: Date | null }
const LOCALE: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" }
const EASE = [0.16, 1, 0.3, 1] as const

/** Bouton d'inscription ou de decouverte, tel que configure dans l'admin. */
function EventLink({ e, className }: { e: EventItem; className: string }) {
  const { t } = useLanguage()
  const href = e.registrationUrl || e.exploreUrl
  if (!href) return null
  const label = e.registrationUrl ? e.registrationButtonText || t("events.register") : e.exploreButtonText || t("events.moreInfo")
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label} <ArrowUpRight className="h-4 w-4" />
    </a>
  )
}

/**
 * Rideau des rendez-vous passes, pose a gauche du repere « Aujourd'hui ».
 * Ferme : un pan de velours rouge a frange or cache les evenements passes.
 * Ouvert : le pan se resserre sur le cote, retenu par une embrasse or, et les
 * evenements passes se deroulent entre lui et « Aujourd'hui ».
 */
function Curtain({ open, count, onToggle }: { open: boolean; count: number; onToggle: () => void }) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const dur = reduce ? 0 : 0.9
  const label = open ? t("home2.timeline.closeCurtain") : `${t("home2.timeline.openCurtain")} : ${count} ${t("home2.timeline.pastTitle").toLowerCase()}`
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="frise-passes"
      aria-label={label}
      title={label}
      animate={{ width: open ? 64 : 136 }}
      transition={{ duration: dur, ease: EASE }}
      className="group relative z-10 flex h-[15.5rem] shrink-0 flex-col items-stretch self-start outline-none focus-visible:ring-2 focus-visible:ring-or"
    >
      {/* Tringle et ses embouts */}
      <span aria-hidden className="relative z-10 mx-[-6px] h-1.5 rounded-full bg-gradient-to-r from-or-clair via-or to-or-clair shadow-[0_2px_8px_rgba(0,0,0,.5)]">
        <span className="absolute -left-1 -top-[3px] h-3 w-3 rounded-full bg-or-clair" />
        <span className="absolute -right-1 -top-[3px] h-3 w-3 rounded-full bg-or-clair" />
      </span>

      {/* Le pan de velours : plis verticaux + ombre, frange or en bas.
          Ouvert, il se resserre vers l'embrasse (clip-path anime). */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{
          clipPath: open
            ? "polygon(0% 0%, 100% 0%, 42% 58%, 78% 100%, 0% 100%)"
            : "polygon(0% 0%, 100% 0%, 100% 58%, 100% 100%, 0% 100%)",
        }}
        transition={{ duration: dur, ease: EASE }}
        className="relative -mt-0.5 block flex-1 origin-top border-b-[3px] border-dotted border-or transition-transform duration-700 group-hover:[transform:skewX(-1.5deg)]"
        style={{
          background:
            "repeating-linear-gradient(90deg, rgba(0,0,0,.38) 0 2px, transparent 2px 8px, rgba(255,255,255,.08) 8px 10px, transparent 10px 15px)," +
            "linear-gradient(to bottom, color-mix(in oklab, var(--rouge) 72%, black), color-mix(in oklab, var(--rouge) 38%, black))",
        }}
      >
        {/* Lumiere de rampe sur le velours */}
        <span className="absolute inset-0 bg-[radial-gradient(80%_45%_at_50%_0%,rgba(255,216,102,.18),transparent)]" />
      </motion.span>

      {/* Embrasse or (visible rideau ouvert) */}
      <motion.span
        aria-hidden
        initial={false}
        animate={{ opacity: open ? 1 : 0, scaleX: open ? 1 : 0.4 }}
        transition={{ duration: dur * 0.6, delay: open ? dur * 0.5 : 0 }}
        className="absolute left-0 top-[56%] h-2 w-9 origin-left rounded-full bg-gradient-to-r from-or to-or-clair shadow-[0_0_10px_rgba(240,179,35,.6)]"
      />

      {/* Etiquette posee sur le rideau ferme */}
      <motion.span
        initial={false}
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: reduce ? 0 : 0.3 }}
        className="pointer-events-none absolute inset-x-0 top-10 flex flex-col items-center px-2 text-center"
      >
        {/* Couleurs fixes : le velours reste rouge sombre en mode clair comme en sombre */}
        <span className="font-display text-5xl leading-none text-[#f6f1e7] [text-shadow:0_2px_10px_rgba(0,0,0,.6)]">{count}</span>
        <span className="eyebrow mt-2 !text-[9px] !tracking-[0.22em] text-[#ffd866]">{t("home2.timeline.pastTitle")}</span>
        <span className="mt-4 inline-flex items-center gap-1 border border-[#ffd866]/60 px-2 py-1 font-caps text-[9px] uppercase tracking-[0.18em] text-[#f6f1e7] transition-colors group-hover:border-[#ffd866] group-hover:bg-[#ffd866] group-hover:text-[#0b0a08]">
          <ChevronsLeftRight className="h-3 w-3" />{t("home2.timeline.openCurtain")}
        </span>
      </motion.span>

      {/* Sous le rideau ouvert : « Refermer » */}
      <span className={`eyebrow mt-3 !text-[9px] !tracking-[0.2em] text-or transition-opacity ${open ? "opacity-100" : "opacity-0"}`}>
        {t("home2.timeline.closeCurtain")}
      </span>
    </motion.button>
  )
}

/**
 * Agenda en frise horizontale : axe qui se dessine, evenements dans l'ordre
 * chronologique, repere rouge « Aujourd'hui ». Au passage (survol, clavier)
 * un apercu s'ouvre sous l'axe ; au clic, un panneau donne tous les details.
 * Les rendez-vous passes sont replies derriere un rideau (ferme par defaut) :
 * la frise commence a « Aujourd'hui » et montre davantage d'evenements a venir.
 */
export function Events({ initial }: { initial: EventItem[] }) {
  const { t, language } = useLanguage()
  const reduce = useReducedMotion()
  const data = useLocalizedData<EventItem[]>("/api/events", initial)
  const track = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)

  const { upcoming, past } = splitEvents(Array.isArray(data) ? data : [])
  const regular = upcoming.filter((x) => !x.d)
  const pastAsc = [...past].reverse()
  const next = upcoming.filter((x) => x.d)
  const axis: Dated[] = [...pastAsc, ...next]

  const [previewId, setPreviewId] = useState<string | null>(null)
  const [open, setOpen] = useState<EventItem | null>(null)
  const [showPast, setShowPast] = useState(false)
  // L'apercu ne montre qu'un evenement visible (pas un passe cache derriere le rideau)
  const visible = showPast ? axis : next
  const preview = visible.find((x) => x.e.id === previewId) ?? next[0] ?? (showPast ? pastAsc[pastAsc.length - 1] : undefined)

  // Rideau ferme : la frise demarre au debut (rideau + « Aujourd'hui » + a venir)
  useEffect(() => {
    if (!showPast) track.current?.scrollTo({ left: 0, behavior: reduce ? "auto" : "smooth" })
  }, [showPast, reduce])

  // Rideau ouvert : une fois les passes deroules, on fait glisser la frise
  // pour montrer les plus recents, juste avant « Aujourd'hui ».
  const revealPast = () => {
    const el = track.current, mark = todayRef.current
    if (el && mark) el.scrollTo({ left: Math.max(0, mark.offsetLeft - el.clientWidth * 0.62), behavior: reduce ? "auto" : "smooth" })
  }

  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString(LOCALE[language] || "fr-BE", opts)
  const scrollBy = (dir: number) => track.current?.scrollBy({ left: dir * 540, behavior: "smooth" })

  const node = ({ e, d }: Dated, i: number) => {
    const isPast = past.some((p) => p.e.id === e.id)
    const isActive = preview?.e.id === e.id
    return (
      <motion.button
        key={e.id}
        type="button"
        onMouseEnter={() => setPreviewId(e.id)}
        onFocus={() => setPreviewId(e.id)}
        onClick={() => setOpen(e)}
        initial={reduce ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: Math.min(i, 8) * 0.07, ease: EASE }}
        className={`group relative flex w-40 shrink-0 snap-center flex-col items-center text-center outline-none md:w-44 ${isPast ? "opacity-45 hover:opacity-80" : ""}`}
      >
        <span className={`font-display text-5xl leading-none transition-colors ${isActive ? "text-or-clair" : "text-ivoire/80 group-hover:text-or-clair"}`}>
          {d ? String(d.getDate()).padStart(2, "0") : "—"}
        </span>
        <span className="eyebrow mt-2 !text-[10px] text-ivoire/55">{d ? fmt(d, { month: "short", year: "numeric" }) : e.date}</span>
        {/* Noeud pose sur l'axe */}
        <span className="relative my-6 grid h-6 place-items-center">
          <span className={`h-3.5 w-3.5 rotate-45 transition-all duration-300 ${isActive ? "scale-125 bg-or shadow-[0_0_18px_rgba(240,179,35,.9)]" : isPast ? "bg-ivoire/40" : "bg-or/80 group-hover:bg-or"}`} />
        </span>
        <span className={`line-clamp-3 px-2 font-display text-base leading-snug transition-colors md:text-[1.05rem] ${isActive ? "text-ivoire" : "text-ivoire/70"}`}>
          <Rich text={e.title} />
        </span>
      </motion.button>
    )
  }

  return (
    <section id="evenements" className="relative overflow-hidden bg-nuit py-28 text-ivoire md:py-36">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/4 h-1/2 bg-[radial-gradient(60%_50%_at_50%_50%,var(--charbon),transparent)]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Reveal>
              <span className="eyebrow flex items-center gap-3 text-or">
                <span className="h-px w-10 bg-or" aria-hidden />{t("home2.events.label")}
              </span>
            </Reveal>
            <h2 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.6rem)] leading-[1.02]">
              <WordsReveal text={t("home2.events.title")} />
            </h2>
            <p className="mt-4 text-sm text-ivoire/50">{t("home2.timeline.hint")}</p>
          </div>
          {visible.length > 3 && (
            <div className="flex gap-2">
              <button onClick={() => scrollBy(-1)} aria-label={t("home2.timeline.earlier")} className="grid h-12 w-12 place-items-center border border-ivoire/25 hover:border-or hover:text-or-clair">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button onClick={() => scrollBy(1)} aria-label={t("home2.timeline.later")} className="grid h-12 w-12 place-items-center border border-ivoire/25 hover:border-or hover:text-or-clair">
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Rendez-vous reguliers (dates en texte libre : « Chaque dimanche ») */}
        {regular.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <span className="eyebrow flex items-center gap-2 !text-[10px] text-ivoire/50"><Repeat className="h-3.5 w-3.5 text-or" />{t("home2.timeline.regular")}</span>
            {regular.map(({ e }) => (
              <button key={e.id} onClick={() => setOpen(e)} className="border border-or/40 px-4 py-2 text-sm transition-colors hover:bg-or hover:text-nuit">
                <span className="font-display text-base"><Rich text={e.title} /></span>
                <span className="ml-2 text-xs opacity-70">{e.date}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {axis.length === 0 ? (
        <p className="mx-auto mt-14 max-w-7xl px-6 text-ivoire/50">{t("home2.events.none")}</p>
      ) : (
        <>
          {/* La frise */}
          <div ref={track} className="relative mt-14 overflow-x-auto px-6 pb-6 [scrollbar-width:thin] [scrollbar-color:var(--or)_transparent]">
            <div className="relative mx-auto flex w-max snap-x items-start gap-1 md:px-[max(0px,calc((100vw-80rem)/2))]">
              {/* Axe : ligne de fond puis trace or animee (au niveau des noeuds) */}
              <span aria-hidden className="absolute left-0 right-0 top-[6.35rem] h-px bg-ivoire/15" />
              <motion.span
                aria-hidden
                className="absolute left-0 right-0 top-[6.35rem] h-px origin-left bg-gradient-to-r from-ivoire/30 via-or to-or"
                initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                transition={{ duration: 1.8, ease: EASE }}
              />
              {pastAsc.length > 0 && (
                <Curtain open={showPast} count={pastAsc.length} onToggle={() => setShowPast((v) => !v)} />
              )}
              <AnimatePresence initial={false}>
                {showPast && (
                  <motion.div
                    key="passes"
                    id="frise-passes"
                    className="flex shrink-0 items-start gap-1 overflow-hidden"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: "auto", opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: reduce ? 0 : 0.9, ease: EASE }}
                    onAnimationComplete={() => { if (showPast) revealPast() }}
                  >
                    {pastAsc.map((x, i) => node(x, i))}
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Repere « Aujourd'hui » */}
              <div ref={todayRef} className="relative ml-2 flex w-24 shrink-0 flex-col items-center">
                <span className="eyebrow mt-10 !text-[9px] text-rouge">{t("home2.timeline.today")}</span>
                <span aria-hidden className="mt-3 h-14 w-[2px] bg-rouge shadow-[0_0_12px_rgba(239,51,64,.8)]" />
              </div>
              {next.map((x, i) => node(x, i))}
              {next.length === 0 && (
                <p className="mt-[5.4rem] w-64 shrink-0 font-display text-lg italic text-ivoire/50">{t("home2.timeline.noneUpcoming")}</p>
              )}
            </div>
          </div>

          {/* Apercu de l'evenement survole (ou du prochain) */}
          <div className="mx-auto mt-6 max-w-7xl px-6">
            <AnimatePresence mode="wait">
              {preview && (
                <motion.div
                  key={preview.e.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="grid gap-6 border-t border-or/25 pt-8 md:grid-cols-[1fr_auto] md:items-end"
                >
                  <div>
                    <p className="eyebrow !text-[10px] text-or">{preview.d ? fmt(preview.d, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : preview.e.date}</p>
                    <h3 className="mt-3 font-display text-3xl md:text-4xl"><Rich text={preview.e.title} /></h3>
                    <p className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-ivoire/60">
                      {preview.e.time && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-or" />{preview.e.time}</span>}
                      {preview.e.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-or" />{preview.e.location}</span>}
                    </p>
                    <p className="mt-3 line-clamp-2 max-w-3xl text-ivoire/65"><Rich text={preview.e.description} /></p>
                  </div>
                  <button
                    onClick={() => setOpen(preview.e)}
                    className="inline-flex items-center gap-3 self-start bg-or px-6 py-3.5 font-caps text-[11px] uppercase tracking-[0.2em] text-nuit hover:bg-or-clair md:self-end"
                  >
                    {t("home2.timeline.details")} <ArrowRight className="h-4 w-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Panneau de detail */}
      <Sheet open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto border-l border-or/25 bg-nuit p-0 text-ivoire sm:max-w-xl [&>button]:text-ivoire">
          {open && (
            <div>
              {open.image && (
                <img src={getImageUrl(open.image)} alt="" className="fondu h-72 w-full object-cover" />
              )}
              <div className={`px-8 pb-10 ${open.image ? "-mt-10" : "pt-14"} relative`}>
                <p className="eyebrow !text-[10px] text-or">{open.date}</p>
                <SheetTitle className="mt-3 font-display text-4xl font-normal leading-tight text-ivoire"><Rich text={open.title} /></SheetTitle>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ivoire/70">
                  {open.time && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-or" />{open.time}</span>}
                  {open.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-or" />{open.location}</span>}
                </div>
                <span aria-hidden className="mt-6 block h-px w-12 bg-rouge" />
                <SheetDescription asChild>
                  <div className="mt-6 whitespace-pre-line leading-relaxed text-ivoire/80"><Rich text={open.description} /></div>
                </SheetDescription>
                <EventLink e={open} className="mt-8 inline-flex items-center gap-2 bg-or px-6 py-3.5 font-caps text-[11px] uppercase tracking-[0.2em] text-nuit hover:bg-or-clair" />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}
