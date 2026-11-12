"use client"

import { motion, useReducedMotion } from "motion/react"
import { Clock, ExternalLink, MapPin } from "lucide-react"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { type Countdown, phaseOf, progressOf, remaining, targetOf, visibleUnits } from "@/lib/countdown"
import { useNow } from "@/components/site/countdown-banner"
import { Reveal } from "@/components/site/motion-kit"
import { Rich } from "@/components/site/rich-text"

const fmtDate = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang === "fr" ? "fr-BE" : lang === "nl" ? "nl-BE" : "en-GB", { day: "numeric", month: "short", year: "numeric" })

/**
 * Un compte a rebours en grand (page Temps forts) : chiffres monumentaux,
 * frise de la periode (debut → fin, losange rouge = aujourd'hui), infos
 * pratiques, image fondue.
 */
export function CountdownFeature({ countdown: c, tone = "charbon" }: { countdown: Countdown; tone?: "charbon" | "nuit" }) {
  const { t, language } = useLanguage()
  const reduce = useReducedMotion()
  const now = useNow()
  if (now && phaseOf(c, now) === "ended") return null
  const phase = now ? phaseOf(c, now) : "upcoming"
  const r = now ? remaining(targetOf(c, now), now) : null
  const units = r ? visibleUnits(r) : (["days", "hours", "mins", "secs"] as const)
  const progress = now ? progressOf(c, now) : 0
  // Six unites (annees → secondes) doivent tenir sur une ligne
  const digitSize = units.length > 4 ? "text-[clamp(2.2rem,4.4vw,4.2rem)]" : "text-[clamp(2.6rem,6vw,5.5rem)]"
  const gap = units.length > 4 ? "px-3 sm:px-5" : "px-5 sm:px-8"

  return (
    <section id={`compte-${c.id}`} className={`relative overflow-hidden py-28 text-ivoire ${tone === "nuit" ? "bg-nuit" : "bg-[linear-gradient(to_bottom,var(--nuit),var(--charbon)_30%,var(--charbon)_70%,var(--nuit))]"}`}>
      {/* Filigrane : grand losange or */}
      <div aria-hidden className="absolute -right-40 top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rotate-45 border border-or/10" />
      <div aria-hidden className="absolute -right-24 top-1/2 h-[24rem] w-[24rem] -translate-y-1/2 rotate-45 border border-or/10" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <Reveal>
            <span className="eyebrow flex items-center gap-3 text-or">
              <span className="relative flex h-2 w-2">
                {phase === "running" && !reduce && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rouge opacity-75" />}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rouge" />
              </span>
              {phase === "running" ? t("home2.countdown.running") : t("home2.countdown.startsIn")}
            </span>
            <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4.5rem)] leading-[1.02]"><Rich text={c.title} /></h2>
            {c.subtitle && <p className="mt-4 max-w-xl text-lg text-ivoire/70"><Rich text={c.subtitle} /></p>}
          </Reveal>

          {/* Chiffres monumentaux separes par des filets or */}
          <div className="mt-12 flex flex-wrap items-end" aria-live="off">
            {units.map((u, i) => (
              <div key={u} className={`${gap} ${i === 0 ? "!pl-0" : "border-l border-or/25"}`}>
                <div className={`font-display ${digitSize} font-medium leading-none tabular-nums text-or-clair`}>
                  {r ? String(r[u]).padStart(2, "0") : "--"}
                </div>
                <div className="eyebrow mt-3 !text-[9px] text-ivoire/50">{t(`home2.countdown.unitsLong.${u}`)}</div>
              </div>
            ))}
          </div>

          {/* Frise de la periode */}
          <div className="mt-14 max-w-2xl">
            <div className="relative h-px bg-ivoire/20">
              <motion.div
                className="absolute inset-y-0 left-0 bg-or"
                initial={{ width: 0 }} whileInView={{ width: `${progress * 100}%` }} viewport={{ once: true }}
                transition={{ duration: reduce ? 0 : 1.6, ease: [0.16, 1, 0.3, 1] }}
              />
              {phase === "running" && (
                <span className="absolute -top-[5px] h-[11px] w-[11px] -translate-x-1/2 rotate-45 bg-rouge" style={{ left: `${progress * 100}%` }} />
              )}
            </div>
            <div className="mt-3 flex justify-between text-xs text-ivoire/55">
              <span>{fmtDate(c.startsAt, language)}</span>
              {phase === "running" && <span className="text-or-clair">{Math.round(progress * 100)} % {t("home2.countdown.elapsed")}</span>}
              <span>{fmtDate(c.endsAt, language)}</span>
            </div>
          </div>

          {(c.location || c.schedule || c.info || c.linkUrl) && (
            <div className="mt-12 flex flex-wrap items-start gap-x-10 gap-y-5 border-t border-ivoire/10 pt-8 text-sm text-ivoire/75">
              {c.location && <p className="flex max-w-xs gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-or" />{c.location}</p>}
              {c.schedule && <p className="flex max-w-xs gap-2"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-or" />{c.schedule}</p>}
              {c.info && <p className="max-w-md whitespace-pre-line"><Rich text={c.info} /></p>}
              {c.linkUrl && (
                <a href={c.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-or px-6 py-3 font-caps text-[11px] uppercase tracking-[0.2em] text-nuit hover:bg-or-clair">
                  {c.linkLabel || t("home2.countdown.more")} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {!c.image && (
          // Sans image : la periode en grandes annees gravees, reliees par le fil d'or
          <Reveal delay={0.2} className="hidden lg:block">
            <div aria-hidden className="flex flex-col items-center font-display leading-none">
              <span className="text-outline-or text-[9rem]">{new Date(c.startsAt).getFullYear()}</span>
              <span className="my-4 h-24 w-px bg-gradient-to-b from-or to-rouge" />
              <span className="text-[9rem] text-or-clair">{new Date(c.endsAt).getFullYear()}</span>
            </div>
          </Reveal>
        )}

        {c.image && (
          <Reveal delay={0.2} className="mx-auto w-full max-w-md">
            <img src={getImageUrl(c.image)} alt="" loading="lazy" decoding="async" className="fondu aspect-[4/5] w-full scale-110 object-cover" />
          </Reveal>
        )}
      </div>
    </section>
  )
}
