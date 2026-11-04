"use client"

/**
 * « Masquer / Afficher » sans supprimer.
 *
 *   <VisibilityToggle resource="events" id={e.id} status={e.status} label={e.title}
 *     onChange={(status) => setEvents(list => list.map(x => x.id === e.id ? { ...x, status } : x))} />
 *
 * Seul le statut change (route PATCH /api/<resource>/:id/status) : le contenu,
 * les images, l'ordre… restent intacts. Le changement s'affiche tout de suite ;
 * si le serveur refuse, on revient en arrière et un message d'échec s'affiche.
 * Après un succès, un bouton « Annuler » permet de revenir en arrière.
 */
import { useState } from "react"
import { Eye, EyeOff, Loader2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { setVisibility, type Visibility } from "@/lib/admin-api"
import { notify } from "@/lib/admin-notify"

export const isVisible = (status?: string | null) => (status ?? "published") === "published"

type Mode = "masquer" | "fermer"

const TEXTS: Record<Mode, { hide: string; show: string; hidden: string; shown: string; hiddenDetail: string; shownDetail: string }> = {
  masquer: {
    hide: "Masquer", show: "Afficher",
    hidden: "masqué", shown: "de nouveau visible",
    hiddenDetail: "Il ne s'affiche plus sur le site. Rien n'est supprimé : vous pouvez le réafficher à tout moment.",
    shownDetail: "Il s'affiche de nouveau sur le site.",
  },
  fermer: {
    hide: "Fermer", show: "Rouvrir",
    hidden: "fermé", shown: "rouvert",
    hiddenDetail: "Le lien affiche « formulaire fermé » : plus personne ne peut répondre. Les réponses déjà reçues sont conservées.",
    shownDetail: "Le formulaire accepte de nouveau des réponses.",
  },
}

export function VisibilityToggle({
  resource, id, status, label, onChange, mode = "masquer", hiddenStatus, size = "sm", compact = false,
}: {
  resource: string
  id: string
  status?: string | null
  /** Nom de l'élément, repris dans le message (« Convention 2026 » masqué). */
  label?: string
  onChange: (status: Visibility) => void
  mode?: Mode
  hiddenStatus?: Visibility
  size?: "sm" | "default"
  /** Icône seule (le texte reste dans l'info-bulle). */
  compact?: boolean
}) {
  const [busy, setBusy] = useState(false)
  const visible = isVisible(status)
  const t = TEXTS[mode]
  const hiddenValue: Visibility = hiddenStatus ?? (mode === "fermer" ? "closed" : "draft")
  const name = label ? `« ${label} »` : "Élément"

  const apply = async (next: Visibility, previous: Visibility, withUndo: boolean) => {
    setBusy(true)
    onChange(next)
    try {
      await setVisibility(resource, id, next)
      const nowVisible = next === "published"
      const title = `${name} ${nowVisible ? t.shown : t.hidden}`
      const detail = nowVisible ? t.shownDetail : t.hiddenDetail
      if (withUndo) notify.undoable(title, () => apply(previous, next, false), { detail, id: `vis-${id}` })
      // Après « Annuler », le message d'origine vient d'être fermé : nouvel identifiant
      else notify.success(title, { detail, id: `vis-${id}-annule` })
    } catch (e) {
      onChange(previous)
      notify.error(`Impossible de modifier la visibilité de ${name.toLowerCase() === "élément" ? "l'élément" : name}`, {
        erreur: e,
        id: `vis-${id}`,
        reessayer: () => apply(next, previous, withUndo),
      })
    } finally {
      setBusy(false)
    }
  }

  const toggle = () => {
    const previous = (status as Visibility) || "published"
    apply(visible ? hiddenValue : "published", previous, true)
  }

  const Icon = busy ? Loader2 : visible ? (mode === "fermer" ? Lock : EyeOff) : Eye
  const text = visible ? t.hide : t.show
  const tip = visible
    ? `${text} : ne plus afficher sur le site, sans supprimer`
    : `${text} : remettre sur le site`

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "icon-sm" : size}
      onClick={toggle}
      disabled={busy}
      title={tip}
      aria-label={tip}
    >
      <Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
      {!compact && text}
    </Button>
  )
}

/** Pastille de statut en français. */
export function StatusBadge({ status, className = "", form = false }: { status?: string | null; className?: string; form?: boolean }) {
  const s = status ?? "published"
  const conf: Record<string, { text: string; cls: string; Icon: typeof Eye }> = {
    published: { text: form ? "Ouvert" : "Visible", cls: "border-or/40 text-or", Icon: Eye },
    draft: { text: "Masqué", cls: "border-border text-muted-foreground", Icon: EyeOff },
    closed: { text: "Fermé", cls: "border-[var(--rouge)]/50 text-[var(--rouge-texte)]", Icon: Lock },
    archived: { text: "Archivé", cls: "border-border text-muted-foreground", Icon: EyeOff },
  }
  const c = conf[s] ?? { text: s, cls: "border-border text-muted-foreground", Icon: Eye }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${c.cls} ${className}`}>
      <c.Icon className="h-3 w-3" />
      {c.text}
    </span>
  )
}

/** Compteur en haut de liste : « 5 visibles · 2 masqués ». */
export function VisibilitySummary({ items, className = "" }: { items: { status?: string | null }[]; className?: string }) {
  const shown = items.filter((i) => isVisible(i.status)).length
  const hidden = items.length - shown
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground ${className}`}>
      <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4 text-or" />{shown} visible{shown > 1 ? "s" : ""} sur le site</span>
      {hidden > 0 && (
        <span className="inline-flex items-center gap-1.5"><EyeOff className="h-4 w-4" />{hidden} masqué{hidden > 1 ? "s" : ""}</span>
      )}
    </p>
  )
}

/** Classe à poser sur la carte d'un élément masqué (semi-transparent). */
export const hiddenCls = (status?: string | null) => (isVisible(status) ? "" : "opacity-60")
