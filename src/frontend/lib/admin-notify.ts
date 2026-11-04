"use client"

/**
 * Messages de validation de l'administration (succès, échec, alerte, info).
 *
 * Une seule API pour toutes les pages, affichée par Sonner (components/ui/sonner.tsx,
 * monté une fois dans components/admin/admin-shell.tsx) :
 *
 *   notify.success("Événement publié", { detail: "Visible dans l'Agenda", lien: { href: "/#evenements" } })
 *   notify.error("Enregistrement impossible", { detail: err.message, reessayer: save })
 *   notify.warning("Image très grande", { detail: "Le chargement sera plus lent." })
 *   notify.info("Lien copié")
 *   await notify.promise(envoi(), { chargement: "Envoi…", succes: "Envoyé", erreur: "Échec de l'envoi" })
 *   notify.undoable("Élément masqué", () => reafficher())
 *
 * Règles : un succès dit ce qui a été fait et où c'est visible ; un échec dit
 * ce qui a raté, pourquoi, et propose de réessayer. Une erreur reste affichée
 * jusqu'à ce qu'on la ferme (on a le temps de la lire).
 */
import { toast } from "sonner"
import { AdminApiError, errorText } from "@/lib/admin-api"

export type Lien = { href: string; label?: string }

type Base = { detail?: string; id?: string | number }

const openLink = (href: string) => window.open(href, "_blank", "noopener")

function errorDetail(e: unknown): string | undefined {
  if (e instanceof AdminApiError) return e.detail ? `${e.message} (${e.detail})` : e.message
  return e === undefined ? undefined : errorText(e)
}

export const notify = {
  success(title: string, opts: Base & { lien?: Lien } = {}) {
    return toast.success(title, {
      id: opts.id,
      description: opts.detail,
      duration: 4500,
      action: opts.lien
        ? { label: opts.lien.label ?? "Voir sur le site", onClick: () => openLink(opts.lien!.href) }
        : undefined,
    })
  },

  error(title: string, opts: Base & { reessayer?: () => void; erreur?: unknown } = {}) {
    // Une session expirée redirige déjà vers le login : inutile d'empiler un message
    if (opts.erreur instanceof AdminApiError && opts.erreur.status === 401) return
    return toast.error(title, {
      id: opts.id,
      description: opts.detail ?? errorDetail(opts.erreur),
      duration: Infinity,
      action: opts.reessayer ? { label: "Réessayer", onClick: opts.reessayer } : undefined,
    })
  },

  warning(title: string, opts: Base = {}) {
    return toast.warning(title, { id: opts.id, description: opts.detail, duration: 7000 })
  },

  info(title: string, opts: Base = {}) {
    return toast.info(title, { id: opts.id, description: opts.detail, duration: 4000 })
  },

  /** Action longue : un message « en cours » qui se transforme en succès ou en échec. */
  async promise<T>(
    action: Promise<T>,
    msgs: {
      chargement: string
      succes: string | ((r: T) => string)
      erreur: string
      detailSucces?: string | ((r: T) => string | undefined)
    },
  ): Promise<T> {
    const id = toast.loading(msgs.chargement)
    try {
      const r = await action
      const detail = typeof msgs.detailSucces === "function" ? msgs.detailSucces(r) : msgs.detailSucces
      toast.success(typeof msgs.succes === "function" ? msgs.succes(r) : msgs.succes, {
        id,
        description: detail,
        duration: 5000,
      })
      return r
    } catch (e) {
      if (e instanceof AdminApiError && e.status === 401) toast.dismiss(id)
      else toast.error(msgs.erreur, { id, description: errorDetail(e), duration: Infinity })
      throw e
    }
  },

  /** Succès réversible : bouton « Annuler » pendant quelques secondes. */
  undoable(title: string, annuler: () => void, opts: Base = {}) {
    return toast.success(title, {
      id: opts.id,
      description: opts.detail,
      duration: 6500,
      action: { label: "Annuler", onClick: annuler },
    })
  },

  dismiss(id?: string | number) {
    toast.dismiss(id)
  },
}
