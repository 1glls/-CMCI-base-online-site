import Link from "next/link"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"
import { HOME_PATH } from "@/lib/site"

/**
 * Gabarit des pages légales (confidentialité, conditions d'utilisation).
 * Texte long et sobre : un titre, une date de mise à jour, des sections
 * numérotées, puis un résumé en anglais (utile aux plateformes partenaires
 * qui relisent ces pages, comme TikTok).
 */
export function LegalPage({
  eyebrow, title, updated, intro, settings, children,
}: {
  eyebrow: string
  title: string
  updated: string
  intro: string
  settings: Record<string, string>
  children: React.ReactNode
}) {
  return (
    <main className="grain-page bg-nuit">
      <SiteHeader home={HOME_PATH} />
      <article className="bg-nuit pb-28 pt-44 text-ivoire md:pt-52">
        <div className="mx-auto max-w-3xl px-6">
          <span className="eyebrow flex items-center gap-3 text-or">
            <span className="h-px w-10 bg-or" aria-hidden />{eyebrow}
          </span>
          <h1 className="mt-6 font-display text-[clamp(2.4rem,5vw,4.2rem)] leading-[1.02]">{title}</h1>
          <p className="mt-5 text-sm text-ivoire/50">{updated}</p>
          <p className="mt-8 text-lg leading-relaxed text-ivoire/80">{intro}</p>

          <div className="legal-body mt-6 [&_a]:text-or-clair [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:text-or [&_li]:leading-relaxed [&_p]:mt-4 [&_p]:leading-relaxed [&_p]:text-ivoire/75 [&_strong]:font-semibold [&_strong]:text-ivoire [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-ivoire/75">
            {children}
          </div>

          <nav aria-label="Autres pages légales" className="mt-16 flex flex-wrap gap-x-8 gap-y-3 border-t border-ivoire/10 pt-8 font-caps text-[11px] uppercase tracking-[0.2em]">
            <Link href="/confidentialite" className="text-or-clair hover:text-ivoire">Politique de confidentialité</Link>
            <Link href="/conditions" className="text-or-clair hover:text-ivoire">Conditions d'utilisation</Link>
            <Link href={HOME_PATH} className="text-ivoire/50 hover:text-ivoire">Retour à l'accueil</Link>
          </nav>
        </div>
      </article>
      <SiteFooter home={HOME_PATH} settings={settings} />
    </main>
  )
}

/** Section numérotée d'une page légale. */
export function LegalSection({ id, n, title, children }: { id?: string; n: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-14 scroll-mt-28">
      <h2 className="flex items-baseline gap-4 font-display text-[clamp(1.6rem,3vw,2.2rem)] leading-tight">
        <span className="font-caps text-sm tracking-[0.2em] text-or">{String(n).padStart(2, "0")}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

/** Adresse de contact (lue dans Paramètres de l'admin), cliquable. */
export function ContactMail({ settings }: { settings: Record<string, string> }) {
  const email = settings.contact_email
  return email ? <a href={`mailto:${email}`}>{email}</a> : <>l'adresse de contact indiquée en bas de page</>
}
