"use client"

import { useRef, type ReactNode } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

const EASE = [0.16, 1, 0.3, 1] as const

/**
 * Couture entre deux sections : un filet d'or qui s'ouvre depuis le centre
 * au rythme du defilement, un losange rouge qui pivote et un halo dore.
 */
export function SectionSeam() {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 45%"] })
  const width = useTransform(scrollYProgress, [0, 1], reduce ? ["70%", "70%"] : ["0%", "70%"])
  const rotate = useTransform(scrollYProgress, [0, 1], reduce ? [45, 45] : [-135, 45])
  const glow = useTransform(scrollYProgress, [0, 0.6, 1], [0, 1, 0.55])

  return (
    <div ref={ref} aria-hidden className="relative flex h-28 items-center justify-center">
      <motion.span style={{ opacity: glow }} className="absolute h-24 w-[40%] rounded-full bg-or/15 blur-3xl" />
      <motion.span style={{ width }} className="absolute h-px bg-gradient-to-r from-transparent via-or to-transparent" />
      <motion.span style={{ rotate }} className="relative h-3 w-3 bg-rouge shadow-[0_0_16px_var(--rouge)]" />
    </div>
  )
}

/**
 * Entree d'une section : elle monte et apparait quand elle arrive a
 * l'ecran. Le fond etant le meme partout, aucune couture n'apparait pendant
 * le mouvement. (Pas de flou : un filtre CSS laisse sur la section
 * perturberait les elements fixes qu'elle contient.)
 */
export function SectionReveal({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 1.1, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
