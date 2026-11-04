"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowUpRight } from "lucide-react"
import { getFileUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"

export interface HeroBook {
  id: string
  title: string
  author: string | null
  cover: string | null
  languageCode: string | null
  priceLabel: string | null
}

/** Couverture, ou a defaut une couverture typographique sobre (lien presigne expire, image absente). */
function Cover({ book, eager }: { book: HeroBook; eager: boolean }) {
  const [failed, setFailed] = useState(!book.cover)
  if (failed) {
    return (
      <span className="flex h-full w-full flex-col justify-between rounded-[3px] bg-gradient-to-br from-charbon to-nuit p-4 text-left ring-1 ring-or/40">
        <span className="h-px w-8 bg-or" />
        <span className="font-display text-xl leading-tight text-ivoire">{book.title}</span>
        <span className="eyebrow !text-[8px] text-or-clair">{book.author}</span>
      </span>
    )
  }
  return (
    <img
      src={getFileUrl(book.cover)} alt=""
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      className="h-full w-full rounded-[3px] object-cover shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
    />
  )
}

/**
 * Eventail de couvertures : le livre au premier plan change toutes les 5 s,
 * les autres se rangent derriere en eventail. Clic sur un livre en retrait :
 * il passe devant ; clic sur celui de devant : sa fiche.
 */
export function BookFan({ books, size = "lg" }: { books: HeroBook[]; size?: "lg" | "md" }) {
  const { t } = useLanguage()
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = books.length

  useEffect(() => {
    if (n < 2 || paused || reduce) return
    const id = setInterval(() => setActive((a) => (a + 1) % n), 5000)
    return () => clearInterval(id)
  }, [n, paused, reduce])

  if (n === 0) return null
  const w = size === "lg" ? "w-[clamp(150px,19vw,250px)]" : "w-[clamp(130px,15vw,200px)]"
  const front = books[active % n]

  return (
    <div className="flex flex-col items-center" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className={`relative ${w} aspect-[2/3]`} style={{ perspective: 1400 }}>
        {/* Halo d'or derriere la pile */}
        <div aria-hidden className="absolute -inset-[35%] rounded-full bg-or/25 blur-3xl" />
        {books.map((b, i) => {
          const pos = (i - active + n) % n
          const shown = pos < 5
          return (
            <motion.button
              key={b.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={b.title}
              tabIndex={pos === 0 ? -1 : 0}
              className="absolute inset-0 origin-bottom-left cursor-pointer"
              style={{ zIndex: n - pos, pointerEvents: shown ? "auto" : "none" }}
              initial={false}
              animate={{
                x: `${pos * 22}%`,
                rotate: pos * 6,
                scale: 1 - pos * 0.06,
                opacity: shown ? 1 : 0,
                filter: `brightness(${1 - pos * 0.16})`,
              }}
              whileHover={pos === 0 ? {} : { y: -14 }}
              transition={{ type: "spring", stiffness: 170, damping: 22 }}
            >
              <Cover book={b} eager={pos < 3} />
              {/* reflet de couverture */}
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[3px] bg-gradient-to-tr from-white/0 via-white/0 to-white/15" />
            </motion.button>
          )
        })}
        {/* Le livre de devant ouvre sa fiche */}
        <Link
          href={`/livres/${front.id}`}
          className="absolute inset-0 z-[100]"
          aria-label={`${t("home2.hero.readBook")} : ${front.title}`}
        />
      </div>

      <div className="mt-10 h-16 max-w-xs text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={front.id}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <Link href={`/livres/${front.id}`} className="group inline-flex items-start gap-1 font-display text-xl leading-tight text-ivoire hover:text-or-clair">
              <span className="line-clamp-2">{front.title}</span>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-or transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            {front.author && <p className="mt-1 text-xs text-ivoire/55">{front.author}</p>}
          </motion.div>
        </AnimatePresence>
      </div>

      {n > 1 && (
        <div className="mt-3 flex gap-2" role="tablist">
          {books.map((b, i) => (
            <button
              key={b.id} onClick={() => setActive(i)} aria-label={b.title} aria-selected={i === active % n} role="tab"
              className={`h-1 transition-all ${i === active % n ? "w-8 bg-or" : "w-3 bg-ivoire/25 hover:bg-ivoire/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
