"use client"

/**
 * En-tête commun des pages admin : fil d'Ariane, titre, description,
 * boutons d'action, et encadré « Où ça s'affiche » avec « Voir sur le site ».
 * Les textes viennent de lib/admin-sections.ts (une seule source).
 */
import Link from "next/link"
import { ChevronRight, ExternalLink, MapPinned, Info } from "lucide-react"
import { ADMIN_GROUPS, ADMIN_SECTIONS } from "@/lib/admin-sections"

export function AdminPageHeader({
  section, title, description, actions, children,
}: {
  /** Clé de la section (lib/admin-sections.ts) : fournit titre, description et « Où ça s'affiche ». */
  section?: string
  title?: string
  description?: string
  actions?: React.ReactNode
  /** Contenu supplémentaire sous l'encadré (alertes de contexte…). */
  children?: React.ReactNode
}) {
  const s = ADMIN_SECTIONS.find((x) => x.key === section)
  const group = ADMIN_GROUPS.find((g) => g.key === s?.group)
  const heading = title ?? s?.title ?? ""
  const lead = description ?? s?.description

  return (
    <div className="mb-8 space-y-5">
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/admin/dashboard" className="hover:text-or">Tableau de bord</Link>
        {group && (<><ChevronRight className="h-3 w-3" /><span>{group.title}</span></>)}
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground/80">{heading}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          {group && (
            <span className="eyebrow flex items-center gap-3 text-or">
              <span className="h-px w-8 bg-or" aria-hidden />
              {group.title}
            </span>
          )}
          <h1 className="mt-2 font-display text-4xl leading-tight text-foreground">{heading}</h1>
          {lead && <p className="mt-1 text-sm text-muted-foreground">{lead}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {s && <WhereItAppears where={s.where} href={s.publicHref} />}
      {children}
    </div>
  )
}

export function WhereItAppears({ where, href }: { where: string; href?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-or/25 bg-or/5 px-4 py-3 sm:flex-row sm:items-center">
      <MapPinned className="hidden h-5 w-5 shrink-0 text-or sm:block" aria-hidden />
      <p className="flex-1 text-sm leading-relaxed text-foreground/85">
        <span className="font-semibold text-or">Où ça s'affiche ? </span>
        {where}
      </p>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-or/40 px-3 py-1.5 text-sm text-or transition-colors hover:bg-or hover:text-primary-foreground sm:self-auto"
        >
          <ExternalLink className="h-4 w-4" />
          Voir sur le site
        </a>
      )}
    </div>
  )
}

/** Petite aide sous un champ de formulaire. */
export function FieldHelp({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`mt-1.5 flex gap-1.5 text-xs leading-relaxed text-muted-foreground ${className}`}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  )
}
