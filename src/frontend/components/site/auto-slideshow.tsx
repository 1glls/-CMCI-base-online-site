"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react"
import { getImageUrl } from "@/lib/api"

/**
 * Diaporama automatique, sans vignettes, points ni fleches : les photos se
 * succedent en fondu enchaine avec un zoom lent (effet « Ken Burns »).
 * - pause quand il n'est pas a l'ecran (useInView) ;
 * - image fixe si l'utilisateur limite les animations, ou s'il n'y a qu'une photo ;
 * - la photo suivante est prechargee pour eviter un flash.
 * `className` porte la forme du fondu (.fondu, .fondu-vers-gauche…).
 */
export function AutoSlideshow({
  images, interval = 6000, className = "", imgClassName = "",
}: { images: string[]; interval?: number; className?: string; imgClassName?: string }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.2 })
  const [index, setIndex] = useState(0)
  const list = images.filter(Boolean)
  const playing = list.length > 1 && inView && !reduce

  useEffect(() => {
    if (!playing) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % list.length), interval)
    return () => clearTimeout(id)
  }, [playing, index, interval, list.length])

  // Prechargement de la photo suivante
  useEffect(() => {
    if (list.length < 2) return
    const img = new Image()
    img.src = getImageUrl(list[(index + 1) % list.length])
  }, [index, list])

  if (list.length === 0) return null
  const current = list[index % list.length]

  return (
    <div ref={ref} aria-hidden className={`relative overflow-hidden ${className}`}>
      <AnimatePresence initial={false}>
        <motion.img
          key={current + index}
          src={getImageUrl(current)} alt=""
          className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
          initial={{ opacity: 0, scale: reduce ? 1 : 1.12 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.6 }, scale: { duration: reduce ? 0 : interval / 1000 + 1.6, ease: "linear" } }}
        />
      </AnimatePresence>
    </div>
  )
}
