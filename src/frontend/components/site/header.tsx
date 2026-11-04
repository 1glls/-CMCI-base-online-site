"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { API_URL } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageSwitcher } from "./language-switcher"
import type { Countdown } from "@/lib/countdown"
import { CountdownBanner } from "./countdown-banner"
import { Logo } from "./logo"
import { ThemeToggle } from "./theme-toggle"

type NavItem = { href: string; label: string }
type NavGroup = { label: string; items: NavItem[] }
type NavEntry = NavItem | NavGroup
const isGroup = (e: NavEntry): e is NavGroup => "items" in e

/**
 * En-tete « Nuit & or » : transparent au-dessus du hero, noir translucide
 * des que l'on defile. `home` est la page qui porte les ancres (/ en
 * production). Sans `countdowns` (pages hors
 * accueil), le bandeau charge lui-meme les comptes a rebours.
 */
export function SiteHeader({ home = "/", countdowns }: { home?: string; countdowns?: Countdown[] }) {
  const { t, language } = useLanguage()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [items, setItems] = useState<Countdown[]>(countdowns ?? [])

  useEffect(() => {
    if (countdowns && language === "fr") return
    fetch(`${API_URL}/api/countdowns?lang=${language}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => Array.isArray(d) && setItems(d))
      .catch(() => {})
  }, [countdowns, language])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Pas de defilement de la page derriere le menu mobile
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [menuOpen])

  const a = (hash: string) => `${home}#${hash}`
  // Cinq entrees de premier niveau, pas une de plus : les nouvelles pages se
  // rangent dans les menus existants. « Contact » est devenu « Mieux nous
  // connaitre » (le contact figure sur cette page).
  const nav: NavEntry[] = [
    { href: a("accueil"), label: t("nav.home") },
    {
      label: t("nav.discover"),
      items: [
        { href: a("valeurs"), label: t("home2.nav.identity") },
        { href: a("ministeres"), label: t("nav.ministries") },
      ],
    },
    {
      label: t("nav.churchLife"),
      items: [
        { href: a("evenements"), label: t("home2.nav.agenda") },
        { href: "/temps-forts", label: t("home2.nav.highlights") },
        { href: a("assemblees"), label: t("nav.assemblies") },
        { href: "/galerie", label: t("home2.nav.gallery") },
      ],
    },
    { href: "/livres", label: t("nav.books") },
    { href: "/mieux-nous-connaitre", label: t("home2.nav.knowUs") },
  ]
  const flat = nav.flatMap((e) => (isGroup(e) ? e.items : [e]))

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <CountdownBanner countdowns={items} />
      <div
        className={cn(
          "transition-[background-color,padding,border-color] duration-500",
          scrolled ? "border-b border-or/15 bg-nuit/85 py-2 backdrop-blur-md" : "border-b border-transparent py-4"
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4">
          <Link href={home} className="flex shrink-0 items-center gap-3" aria-label="CMCI Belgique — accueil">
            <Logo className={cn("w-auto transition-all duration-500", scrolled ? "h-11" : "h-14")} />
            <span className="hidden leading-none text-ivoire sm:block">
              <span className="block font-display text-2xl font-semibold tracking-wide">CMCI</span>
              <span className="eyebrow !text-[9px] text-or-clair">{t("nav.country")}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {nav.map((entry) =>
              isGroup(entry) ? (
                <div key={entry.label} className="group relative">
                  <button className="flex items-center gap-1 font-caps text-[11px] uppercase tracking-[0.22em] text-ivoire/85 transition-colors hover:text-or-clair">
                    {entry.label}
                    <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                  </button>
                  <div className="invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-4 opacity-0 transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                    <div className="border border-or/20 bg-nuit/95 py-2 backdrop-blur">
                      {entry.items.map((item) => (
                        <Link
                          key={item.href} href={item.href}
                          className="block px-5 py-2.5 font-display text-lg text-ivoire/85 transition-colors hover:bg-or/10 hover:text-or-clair"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={entry.href} href={entry.href}
                  className="font-caps text-[11px] uppercase tracking-[0.22em] text-ivoire/85 transition-colors hover:text-or-clair"
                >
                  {entry.label}
                </Link>
              )
            )}
            <LanguageSwitcher />
            <ThemeToggle />
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/mieux-nous-connaitre#contact"
              className="hidden border border-or px-5 py-2.5 font-caps text-[11px] uppercase tracking-[0.22em] text-or-clair transition-colors hover:bg-or hover:text-nuit sm:inline-block"
            >
              {t("nav.join")}
            </Link>
            <button onClick={() => setMenuOpen(true)} className="p-2 text-ivoire lg:hidden" aria-label="Menu">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile plein ecran : grands liens en Garamond, apparition en cascade */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ clipPath: "circle(0% at 100% 0%)" }}
            animate={{ clipPath: "circle(150% at 100% 0%)" }}
            exit={{ clipPath: "circle(0% at 100% 0%)" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] flex flex-col bg-nuit px-6 pb-10 pt-6 text-ivoire"
          >
            <div className="flex items-center justify-between">
              <Logo className="h-12 w-auto" />
              <button onClick={() => setMenuOpen(false)} className="p-2" aria-label="Fermer le menu">
                <X className="h-7 w-7" />
              </button>
            </div>
            <nav className="mt-10 flex flex-1 flex-col gap-1 overflow-y-auto">
              {flat.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.05, duration: 0.5 }}
                >
                  <Link href={item.href} onClick={() => setMenuOpen(false)} className="block py-2 font-display text-3xl hover:text-or-clair">
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="flex items-center justify-between border-t border-or/20 pt-6">
              <span className="flex items-center gap-4"><LanguageSwitcher inline /><ThemeToggle /></span>
              <Link
                href="/mieux-nous-connaitre#contact" onClick={() => setMenuOpen(false)}
                className="bg-or px-5 py-3 font-caps text-xs uppercase tracking-[0.2em] text-nuit"
              >
                {t("nav.join")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
