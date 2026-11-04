"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Clock, MapPin, Navigation, Phone } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { useLocalizedData } from "@/hooks/use-localized-data"
import { Reveal, WordsReveal } from "@/components/site/motion-kit"
import type { Assembly } from "@/components/assemblies"

// Leaflet n'existe que dans le navigateur
const AssemblyMap = dynamic(() => import("@/components/assembly-map"), { ssr: false })

/**
 * Assemblees : carte sombre plein cadre a reperes or, et la liste des
 * assemblees en surimpression (filets, pas de cartes).
 */
export function Assemblies({ initial }: { initial: Assembly[] }) {
  const { t } = useLanguage()
  const data = useLocalizedData<Assembly[]>("/api/assemblies", initial)
  const list = Array.isArray(data) ? data : []
  const [selected, setSelected] = useState<Assembly | null>(null)

  return (
    <section id="assemblees" className="relative bg-nuit text-ivoire">
      <div className="map-nuit relative h-[min(88vh,760px)] min-h-[560px] [&_.leaflet-container]:bg-nuit">
        <AssemblyMap assemblies={list} selectedAssembly={selected} onSelectAssembly={setSelected} variant="dark" />
        {/* Fondus pour fondre la carte dans la page */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 z-[400] h-32 bg-gradient-to-b from-nuit to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] h-32 bg-gradient-to-t from-nuit to-transparent" />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-[400] hidden w-[46%] bg-gradient-to-r from-nuit via-nuit/85 to-transparent lg:block" />

        <div className="pointer-events-none absolute inset-0 z-[500] mx-auto flex max-w-7xl items-center px-6">
          <div className="pointer-events-auto w-full max-w-md">
            <Reveal>
              <span className="eyebrow flex items-center gap-3 text-or">
                <span className="h-px w-10 bg-or" aria-hidden />{t("home2.assemblies.label")}
              </span>
            </Reveal>
            <h2 className="mt-5 font-display text-[clamp(2.4rem,5vw,4.4rem)] leading-[1.02]">
              <WordsReveal text={t("home2.assemblies.title")} />
            </h2>
            <ul className="mt-8 max-h-[46vh] overflow-y-auto pr-2 [scrollbar-width:thin]">
              {list.map((a) => (
                <li key={a.id} className="border-t border-ivoire/12 last:border-b">
                  <button
                    onClick={() => setSelected(selected?.id === a.id ? null : a)}
                    className={`w-full py-5 text-left transition-colors ${selected?.id === a.id ? "text-or-clair" : "hover:text-or-clair"}`}
                  >
                    <span className="flex items-center gap-3 font-display text-2xl">
                      <span aria-hidden className={`h-2 w-2 rotate-45 ${selected?.id === a.id ? "bg-rouge" : "bg-or"}`} />
                      CMCI {a.city}
                    </span>
                    <span className="mt-2 flex items-start gap-2 text-sm text-ivoire/60"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-or" />{a.address}</span>
                    {a.schedule && <span className="mt-1 flex items-start gap-2 text-sm text-ivoire/60"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-or" />{a.schedule}</span>}
                  </button>
                  {selected?.id === a.id && (
                    <div className="flex flex-wrap gap-3 pb-5">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.address)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-or px-4 py-2 font-caps text-[10px] uppercase tracking-[0.2em] text-nuit hover:bg-or-clair"
                      >
                        <Navigation className="h-3.5 w-3.5" />{t("home2.assemblies.route")}
                      </a>
                      {a.phone && (
                        <a href={`tel:${a.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 border border-ivoire/30 px-4 py-2 text-xs hover:border-or">
                          <Phone className="h-3.5 w-3.5 text-or" />{a.phone}
                        </a>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
