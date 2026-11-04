"use client"

import { useRef } from "react"
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react"

/**
 * Jonction entre deux sections : une arche qui se bombe a mesure qu'elle
 * entre a l'ecran (le bord plat devient une voute). `fill` est la couleur de
 * la section suivante ; `flip` retourne l'arche pour fermer une section.
 */
export function SectionArch({ fill, flip = false, className = "" }: { fill: string; flip?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end 55%"] })
  // Point de controle de la courbe (repere 1440 x 160) : 150 = bord plat,
  // -140 = voute dont le sommet touche presque le haut (sommet = (300 + 2c) / 4)
  const crest = useTransform(scrollYProgress, [0, 1], reduce ? [-140, -140] : [150, -140])
  const d = useTransform(crest, (c) => `M0,160 L0,150 Q720,${c} 1440,150 L1440,160 Z`)
  const edge = useTransform(crest, (c) => `M0,150 Q720,${c} 1440,150`)

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none relative z-10 -mb-px h-[clamp(60px,9vw,160px)] w-full ${flip ? "-mt-px rotate-180" : ""} ${className}`}>
      <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <motion.path d={d} fill={fill} />
        {/* Fil d'or qui suit la courbe */}
        <motion.path
          d={edge}
          fill="none" stroke="var(--or)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" opacity="0.7"
        />
      </svg>
    </div>
  )
}
