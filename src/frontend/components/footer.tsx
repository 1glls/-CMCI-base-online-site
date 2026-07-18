"use client"

import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import {
  Facebook,
  Youtube,
  Instagram,
  MapPin,
  Phone,
  Mail,
  Heart,
} from "lucide-react"


const socialLinks = [
  { href: "https://facebook.com", icon: Facebook, label: "Facebook" },
  { href: "https://youtube.com", icon: Youtube, label: "YouTube" },
  { href: "https://instagram.com", icon: Instagram, label: "Instagram" },
]

export function Footer() {
  const { t } = useLanguage()

  // Defini a l'interieur du composant : hors du cycle de rendu, les libelles
  // resteraient en francais au changement de langue.
  const quickLinks = [
    { href: "#accueil", label: t('nav.home') },
    { href: "#vision", label: t('nav.vision') },
    { href: "#valeurs", label: t('nav.values') },
    { href: "#evenements", label: t('nav.events') },
    { href: "#assemblees", label: t('nav.assemblies') },
    { href: "#galerie", label: t('nav.gallery') },
  ]

  return (
    <footer className="bg-dark text-white">
      <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-10 justify-center justify-items-center">
        {/* Column 1: About */}
        <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-serif font-bold text-white">
          CMCI
          </div>
          <div>
          <span className="font-serif font-bold text-lg">CMCI</span>
          <span className="block text-sm text-white/60">{t('nav.country')}</span>
          </div>
        </div>
        <p className="text-white/70 leading-relaxed mb-6">
          {t('footer.aboutText')}
        </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
        <h3 className="font-serif font-bold text-lg mb-6">{t('footer.quickLinks')}</h3>
        <ul className="space-y-3">
          {quickLinks.map((link) => (
          <li key={link.href}>
            <Link
            href={link.href}
            className="text-white/70 hover:text-accent transition-colors"
            >
            {link.label}
            </Link>
          </li>
          ))}
        </ul>
        </div>

        
      </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/50">
        <p className="flex items-center gap-1">
          © 2026 CMCI Belgique. {t('footer.rights')}{" "}
          <Heart size={14} className="text-accent" /> {t('footer.forGlory')}
        </p>
        <div className="flex gap-6">
          <Link href="#" className="hover:text-white transition-colors">
          {t('footer.legal')}
          </Link>
          <Link href="#" className="hover:text-white transition-colors">
          {t('footer.privacy')}
          </Link>
        </div>
        </div>
      </div>
      </div>
    </footer>
  )
}
