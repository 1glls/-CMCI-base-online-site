"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageSelector } from "@/components/LanguageSelector"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { t } = useLanguage()

  const navLinks = [
    { href: "#accueil", label: t('nav.home') },
    { href: "#vision", label: t('nav.vision') },
    { href: "#valeurs", label: t('nav.values') },
    { href: "#ministeres", label: t('nav.ministries') },
    { href: "#evenements", label: t('nav.events') },
    { href: "#assemblees", label: t('nav.assemblies') },
    { href: "#galerie", label: t('nav.gallery') },
    { href: "#contact", label: t('nav.contact') },
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white shadow-lg py-3"
          : "bg-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="#accueil" className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-full overflow-hidden flex items-center justify-center transition-all",
            isScrolled ? "bg-white shadow-md" : "bg-white/90"
          )}>
            <Image
              src="/cmci-logo.png"
              alt="CMCI Logo"
              width={48}
              height={48}
              className="object-contain p-1"
            />
          </div>
          <div className={cn(
            "hidden sm:block transition-colors",
            isScrolled ? "text-foreground" : "text-white"
          )}>
            <span className="font-serif font-bold text-lg">CMCI</span>
            <span className="block text-xs opacity-80">Belgique</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-accent",
                isScrolled ? "text-foreground" : "text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className={cn(isScrolled ? "text-foreground" : "text-white")}>
            <LanguageSelector />
          </div>
        </nav>

        {/* CTA Button */}
        <div className="hidden lg:block">
          <Button
            asChild
            className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            <Link href="#contact">Nous rejoindre</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "lg:hidden p-2 transition-colors",
            isScrolled ? "text-foreground" : "text-white"
          )}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "lg:hidden absolute top-full left-0 right-0 bg-white shadow-lg transition-all duration-300 overflow-hidden",
          isMobileMenuOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-foreground py-3 px-4 rounded-lg hover:bg-secondary transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 px-4">
            <LanguageSelector />
          </div>
          <Button
            asChild
            className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            <Link href="#contact" onClick={() => setIsMobileMenuOpen(false)}>
              {t('nav.contact')}
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
