"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useLocalizedData } from "@/hooks/use-localized-data"
import { type Countdown, phaseOf } from "@/lib/countdown"
import { useNow } from "@/components/site/countdown-banner"
import { CountdownFeature } from "./countdown-feature"

/**
 * Pile des comptes a rebours actifs (admin : case « Grand bloc sur la page
 * Temps forts »), en alternant les fonds ; message d'attente s'il n'y en a pas.
 */
export function CountdownList({ initial, home }: { initial: Countdown[]; home: string }) {
  const { t } = useLanguage()
  const now = useNow()
  const data = useLocalizedData<Countdown[]>("/api/countdowns", initial)
  const live = (Array.isArray(data) ? data : []).filter((c) => c.showHome && (!now || phaseOf(c, now) !== "ended"))

  if (live.length === 0) {
    return (
      <section className="bg-nuit pb-32 text-center text-ivoire">
        <p className="mx-auto max-w-xl font-display text-2xl text-ivoire/70">{t("home2.pages.highlights.empty")}</p>
        <Link href={`${home}#evenements`} className="mt-10 inline-flex items-center gap-3 border border-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-or-clair hover:bg-or hover:text-nuit">
          {t("home2.pages.highlights.agenda")} <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    )
  }
  return <>{live.map((c, i) => <CountdownFeature key={c.id} countdown={c} tone={i % 2 ? "nuit" : "charbon"} />)}</>
}
