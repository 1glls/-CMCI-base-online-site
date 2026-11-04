"use client"

import Link from "next/link"
import { ArrowRight, Mail, Phone } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { CircularText, Reveal, WordsReveal } from "./motion-kit"
import { SocialLinks } from "./social-links"
import { NewsletterForm } from "./newsletter-form"
import { Rich } from "./rich-text"
import { Logo } from "./logo"
import { Scripture } from "./scripture"
import { CMFI } from "@/lib/cmfi"

/**
 * Pied de page « Nuit & or », fusionne avec un contact compact : appel,
 * telephone, email, newsletter et lien vers le contact complet. `home` porte
 * les ancres (cf. SiteHeader). `contactBand={false}` sur la page qui affiche
 * deja le contact complet.
 */
export function SiteFooter({
  home = "/", settings = {}, contactBand = true,
}: { home?: string; settings?: Record<string, string>; contactBand?: boolean }) {
  const { t } = useLanguage()
  const a = (hash: string) => `${home}#${hash}`
  const links = [
    { href: "/mieux-nous-connaitre", label: t("home2.nav.knowUs") },
    { href: a("valeurs"), label: t("home2.nav.identity") },
    { href: a("ministeres"), label: t("nav.ministries") },
    { href: a("evenements"), label: t("home2.nav.agenda") },
    { href: "/temps-forts", label: t("home2.nav.highlights") },
    { href: "/galerie", label: t("home2.nav.gallery") },
    { href: "/livres", label: t("nav.books") },
  ]

  return (
    <footer id={contactBand ? "contact" : undefined} className="relative overflow-hidden bg-nuit text-ivoire">
      {contactBand && (
        <div className="relative border-t border-or/20">
          <div aria-hidden className="pointer-events-none absolute -right-32 top-1/4 h-[26rem] w-[26rem] rounded-full bg-or halo blur-[140px]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div>
              <Reveal>
                <span className="eyebrow flex items-center gap-3 text-or">
                  <span className="h-px w-10 bg-or" aria-hidden />{t("home2.contact.label")}
                </span>
              </Reveal>
              <h2 className="mt-5 font-display text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.98]">
                <WordsReveal text={t("home2.contact.title")} />
              </h2>
              <p className="mt-6 max-w-lg text-ivoire/65"><Rich text={t("home2.contact.text")} /></p>
              <Scripture verse="contact" size="md" align="left" className="mt-10" />
              <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 font-display text-xl">
                {settings.contact_phone && (
                  <a href={`tel:${settings.contact_phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 hover:text-or-clair">
                    <Phone className="h-4 w-4 text-or" />{settings.contact_phone}
                  </a>
                )}
                {settings.contact_email && (
                  <a href={`mailto:${settings.contact_email}`} className="inline-flex items-center gap-2 hover:text-or-clair">
                    <Mail className="h-4 w-4 text-or" />{settings.contact_email}
                  </a>
                )}
              </div>
            </div>
            <div className="space-y-8">
              <div>
                <p className="eyebrow mb-2 !text-[10px] text-ivoire/50">{t("contact.newsletter.title")}</p>
                <NewsletterForm id="footer-newsletter" />
              </div>
              <Link
                href="/mieux-nous-connaitre#contact"
                className="group inline-flex items-center gap-3 bg-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-nuit hover:bg-or-clair"
              >
                {t("home2.footer.write")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filet tricolore belge : noir, or, rouge */}
      <div aria-hidden className="flex h-1">
        <span className="flex-1 bg-black" /><span className="flex-1 bg-or" /><span className="flex-1 bg-rouge" />
      </div>
      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex items-start gap-6">
          <div className="relative h-32 w-32 shrink-0 text-or/70">
            <CircularText text={t("home2.about.circular")} className="absolute inset-0 h-full w-full" />
            <Logo alt="CMCI Belgique" className="absolute inset-[20%] h-[60%] w-[60%] object-contain" />
          </div>
          <div>
            <p className="font-display text-3xl">CMCI <span className="text-or-clair">{t("nav.country")}</span></p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivoire/60"><Rich text={t("footer.aboutText")} /></p>
          </div>
        </div>

        <div>
          <p className="eyebrow !text-[10px] text-or">{t("footer.quickLinks")}</p>
          <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="font-display text-lg text-ivoire/75 transition-colors hover:text-or-clair">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Le site mere de la CMCI internationale */}
        <div>
          <p className="eyebrow !text-[10px] text-or">{t("home2.cmfi.footerTitle")}</p>
          <ul className="mt-6 space-y-3">
            {[
              { href: CMFI.home, label: t("home2.cmfi.site") },
              { href: CMFI.vision, label: t("home2.cmfi.vision") },
              { href: CMFI.founder, label: t("home2.cmfi.founder") },
              { href: CMFI.fiveYearGoal, label: t("home2.cmfi.fiveYearGoal") },
              { href: CMFI.contact, label: t("home2.cmfi.contact") },
            ].map((l) => (
              <li key={l.href}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="font-display text-lg text-ivoire/75 transition-colors hover:text-or-clair">
                  {l.label} <span aria-hidden className="text-sm text-or">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="eyebrow !text-[10px] text-or">{t("footer.followUs")}</p>
          <SocialLinks settings={settings} className="mt-7 pl-2" />
          {settings.contact_address && <p className="mt-8 text-sm text-ivoire/60">{settings.contact_address}</p>}
        </div>
      </div>
      <div className="border-t border-ivoire/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-xs text-ivoire/45 md:flex-row">
          <p>© {new Date().getFullYear()} CMCI Belgique. {t("footer.rights")} <span className="text-rouge">♥</span> {t("footer.forGlory")}</p>
          <p className="font-display text-sm italic text-ivoire/40">«&nbsp;<Rich text={t("home2.hero.title")} />&nbsp;»</p>
        </div>
      </div>
    </footer>
  )
}
