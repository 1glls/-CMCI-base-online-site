"use client"

import { Clock, Mail, MapPin, Phone } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { Reveal, WordsReveal } from "@/components/site/motion-kit"
import { SocialLinks } from "@/components/site/social-links"
import { NewsletterForm } from "@/components/site/newsletter-form"
import { Rich } from "@/components/site/rich-text"
import { Scripture } from "@/components/site/scripture"

/**
 * Contact : grand appel « Venez comme vous etes », coordonnees en lignes
 * (reglages admin), reseaux, et inscription a la newsletter.
 */
export function Contact({ settings }: { settings: Record<string, string> }) {
  const { t } = useLanguage()
  const lines = [
    { icon: Phone, label: t("contact.phone"), value: settings.contact_phone, href: settings.contact_phone && `tel:${settings.contact_phone.replace(/\s/g, "")}` },
    { icon: Mail, label: t("contact.email"), value: settings.contact_email, href: settings.contact_email && `mailto:${settings.contact_email}` },
    { icon: MapPin, label: t("contact.address"), value: settings.contact_address },
    { icon: Clock, label: t("contact.hours"), value: settings.contact_hours },
  ].filter((l) => l.value)

  return (
    <section id="contact" className="relative overflow-hidden bg-nuit py-28 text-ivoire md:py-36">
      <div aria-hidden className="absolute -right-32 bottom-0 h-[36rem] w-[36rem] rounded-full bg-or halo blur-[140px]" />
      <div className="relative mx-auto grid max-w-7xl gap-20 px-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <Reveal>
            <span className="eyebrow flex items-center gap-3 text-or">
              <span className="h-px w-10 bg-or" aria-hidden />{t("home2.contact.label")}
            </span>
          </Reveal>
          <h2 className="mt-6 font-display text-[clamp(3rem,7vw,6.4rem)] leading-[0.98]">
            <WordsReveal text={t("home2.contact.title")} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-lg text-lg leading-relaxed text-ivoire/70"><Rich text={t("home2.contact.text")} /></p>
          </Reveal>
          <Scripture verse="contact" size="md" align="left" className="mt-12" />
          <ul className="mt-12">
            {lines.map((l, i) => (
              <Reveal as="li" key={l.label} delay={0.1 * i} className="flex items-baseline gap-6 border-t border-ivoire/12 py-5 last:border-b">
                <span className="eyebrow w-28 shrink-0 !text-[10px] text-ivoire/45">{l.label}</span>
                {l.href ? (
                  <a href={l.href} className="font-display text-2xl transition-colors hover:text-or-clair">{l.value}</a>
                ) : (
                  <span className="font-display text-2xl">{l.value}</span>
                )}
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="flex flex-col justify-end gap-14">
          <Reveal delay={0.2}>
            <h3 className="font-display text-3xl">{t("contact.newsletter.title")}</h3>
            <p className="mt-3 text-ivoire/60">{t("contact.newsletter.description")}</p>
            <div className="mt-8"><NewsletterForm id="contact-newsletter" /></div>
            <p className="mt-3 text-xs text-ivoire/40">{t("contact.newsletter.accept")}</p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="eyebrow mb-6 !text-[10px] text-ivoire/50">{t("footer.followUs")}</p>
            <SocialLinks settings={settings} className="pl-2" />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
