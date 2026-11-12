"use client"

/**
 * Briques d'animation de la charte « Nuit & or » (librairie motion).
 * Tout respecte prefers-reduced-motion : le contenu reste affiche, sans
 * mouvement.
 */
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
  motion, useInView, useReducedMotion, useScroll, useTransform, animate,
  type MotionValue,
} from "motion/react"
import { JESUS_PATTERN } from "./rich-text"

const EASE = [0.16, 1, 0.3, 1] as const

/** Apparition au defilement : fondu + glissement. */
export function Reveal({
  children, delay = 0, y = 36, className, as = "div",
}: { children: ReactNode; delay?: number; y?: number; className?: string; as?: "div" | "li" | "span" }) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </Tag>
  )
}

type Seg = { text: string; red: boolean }

/** Decoupe en mots, chaque mot garde ses morceaux rouges (noms de Jesus). */
function wordsWithJesus(text: string): Seg[][] {
  const chars: { ch: string; red: boolean }[] = []
  text.split(JESUS_PATTERN).forEach((part, i) => {
    for (const ch of part) chars.push({ ch, red: i % 2 === 1 })
  })
  const words: Seg[][] = []
  let current: Seg[] = []
  for (const { ch, red } of chars) {
    if (ch === " ") { if (current.length) words.push(current); current = []; continue }
    const last = current[current.length - 1]
    if (last && last.red === red) last.text += ch
    else current.push({ text: ch, red })
  }
  if (current.length) words.push(current)
  return words
}

/**
 * Titre revele mot a mot, chaque mot monte depuis un masque. Le nom de Jesus reste en rouge.
 * `onLoad` : animation CSS (.hero-mot) lancee des le premier affichage, pour les
 * titres visibles a l'arrivee (hero) \u2014 sans attendre le JavaScript. Sinon : au defilement.
 * Le texte lisible par les lecteurs d'ecran est dans un sr-only (aria-label est
 * interdit sur un simple span).
 */
export function WordsReveal({ text, className, delay = 0, onLoad = false }: { text: string; className?: string; delay?: number; onLoad?: boolean }) {
  const reduce = useReducedMotion()
  const words = wordsWithJesus(text)
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      {words.map((segs, i) => {
        const content = segs.map((sg, j) => (sg.red ? <span key={j} className="text-rouge">{sg.text}</span> : sg.text))
        return (
          <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] align-bottom">
            {onLoad ? (
              <span className="hero-mot inline-block" style={{ "--d": `${delay + i * 0.06}s` } as CSSProperties}>{content}</span>
            ) : (
              <motion.span
                className="inline-block"
                initial={reduce ? false : { y: "110%" }}
                whileInView={{ y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: delay + i * 0.06, ease: EASE }}
              >
                {content}
              </motion.span>
            )}
            {i < words.length - 1 && "\u00a0"}
          </span>
        )
      })}
    </span>
  )
}

/** Compteur qui monte jusqu'a `to` quand il devient visible. */
export function CountUp({ to, format = (n) => String(n), className }: { to: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" })
  const reduce = useReducedMotion()
  const [n, setN] = useState(reduce ? to : 0)
  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, to, { duration: 1.8, ease: EASE, onUpdate: (v) => setN(Math.round(v)) })
    return () => controls.stop()
  }, [inView, reduce, to])
  return <span ref={ref} className={className}>{format(n)}</span>
}

/**
 * Fil d'or vertical qui se dessine au defilement : la « couture » entre deux
 * sections. Le rouge ponctue son extremite.
 */
export function GoldThread({ className = "h-40" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 90%", "end 40%"] })
  const reduce = useReducedMotion()
  const scaleY = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0, 1])
  return (
    <div ref={ref} aria-hidden className={`relative mx-auto w-px ${className}`}>
      <motion.div style={{ scaleY }} className="absolute inset-0 origin-top bg-gradient-to-b from-transparent via-or to-or" />
      <motion.div
        style={{ opacity: scrollYProgress }}
        className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-rouge"
      />
    </div>
  )
}

/** Parallaxe verticale d'un element selon le defilement de sa section. */
export function useParallax(distance = 80): { ref: React.RefObject<HTMLDivElement | null>; y: MotionValue<number> } {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-distance, distance])
  return { ref, y }
}

/**
 * Texte circulaire tournant (repris du logo : « Allez, faites de toutes les
 * nations des disciples… »).
 */
export function CircularText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={`animate-spin-slow ${className}`} aria-hidden>
      <defs>
        <path id="circle-text-path" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
      </defs>
      {/* textLength = circonference (2·π·82) : le texte fait exactement un tour */}
      <text className="fill-current" style={{ fontFamily: "var(--font-caps)", fontSize: 10.5 }}>
        <textPath href="#circle-text-path" textLength={515} lengthAdjust="spacing">{text}</textPath>
      </text>
    </svg>
  )
}
