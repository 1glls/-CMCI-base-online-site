"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageSelector } from "@/components/LanguageSelector"

/**
 * Les ancres sont prefixees par « / » : depuis une page comme /livres, un
 * href="#vision" pointerait vers /livres#vision, une ancre qui n'existe pas.
 * Avec "/#vision", le navigateur revient a l'accueil puis defile.
 */
type NavItem = { href: string; label: string }
type NavGroup = { label: string; items: NavItem[] }
type NavEntry = NavItem | NavGroup

const isGroup = (e: NavEntry): e is NavGroup => 'items' in e

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useLanguage()
  const pathname = usePathname()

  // L'en-tete transparent a texte blanc n'est lisible qu'au-dessus du hero
  // sombre de l'accueil. Partout ailleurs le fond est clair : sans fond
  // opaque, les liens seraient blancs sur blanc, donc invisibles.
  const onHome = pathname === '/'
  const solid = isScrolled || !onHome

  // Neuf entrees de premier niveau faisaient deborder l'en-tete
  // horizontalement entre 1024 et 1300 px. Regroupees en cinq.
  const navEntries: NavEntry[] = [
    { href: "/#accueil", label: t('nav.home') },
    {
      label: t('nav.discover'),
      items: [
        { href: "/#vision", label: t('nav.vision') },
        { href: "/#valeurs", label: t('nav.values') },
        { href: "/#ministeres", label: t('nav.ministries') },
      ],
    },
    {
      label: t('nav.churchLife'),
      items: [
        { href: "/#evenements", label: t('nav.events') },
        { href: "/#assemblees", label: t('nav.assemblies') },
        { href: "/#galerie", label: t('nav.gallery') },
      ],
    },
    { href: "/livres", label: t('nav.books') },
    { href: "/#contact", label: t('nav.contact') },
  ]

  // Liste a plat, pour le menu mobile qui n'a pas de contrainte de largeur
  const flatLinks: NavItem[] = navEntries.flatMap((e) => (isGroup(e) ? e.items : [e]))

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        solid ? "bg-white shadow-lg py-3" : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center overflow-hidden rounded-full transition-all",
            solid ? "bg-white shadow-md" : "bg-white/90"
          )}>
            <Image
              src="/cmci-logo.png" alt="CMCI Logo"
              width={48} height={48} className="object-contain p-1"
            />
          </div>
          <div className={cn(
            "hidden transition-colors sm:block",
            solid ? "text-foreground" : "text-white"
          )}>
            <span className="font-serif text-lg font-bold">CMCI</span>
            <span className="block text-xs opacity-80">{t('nav.country')}</span>
          </div>
        </Link>

        {/* Navigation bureau */}
        <nav className="hidden items-center gap-5 lg:flex">
          {navEntries.map((entry) =>
            isGroup(entry) ? (
              <div key={entry.label} className="group relative">
                <button
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium transition-colors hover:text-accent",
                    solid ? "text-foreground" : "text-white"
                  )}
                >
                  {entry.label}
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </button>
                {/* Le sous-menu reste ouvert au clavier grace a focus-within */}
                <div className="invisible absolute left-0 top-full z-50 w-56 rounded-lg bg-white py-2 text-gray-900 opacity-0 shadow-lg transition-all group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  {entry.items.map((item) => (
                    <Link
                      key={item.href} href={item.href}
                      className="block px-4 py-2 text-sm transition-colors hover:bg-accent/10"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link
                key={entry.href} href={entry.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-accent",
                  solid ? "text-foreground" : "text-white"
                )}
              >
                {entry.label}
              </Link>
            )
          )}
          <div className={cn(solid ? "text-foreground" : "text-white")}>
            <LanguageSelector />
          </div>
        </nav>

        {/* Appel a l'action */}
        <div className="hidden shrink-0 lg:block">
          <Button asChild className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90">
            <Link href="/#contact">{t('nav.join')}</Link>
          </Button>
        </div>

        {/* Menu mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "p-2 transition-colors lg:hidden",
            solid ? "text-foreground" : "text-white"
          )}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={cn(
          "absolute left-0 right-0 top-full overflow-hidden bg-white shadow-lg transition-all duration-300 lg:hidden",
          isMobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
          {flatLinks.map((link) => (
            <Link
              key={link.href} href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 px-4">
            <LanguageSelector />
          </div>
          <Button asChild className="mt-4 bg-accent font-semibold text-accent-foreground hover:bg-accent/90">
            <Link href="/#contact" onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav.join')}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
