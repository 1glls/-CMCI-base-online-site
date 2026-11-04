"use client"

/**
 * Boîte de confirmation de l'administration (remplace `confirm()` du navigateur).
 *
 *   const choix = await askConfirm({
 *     title: "Supprimer « Convention 2026 » ?",
 *     description: "L'image sera aussi effacée. Cette action est irréversible.",
 *     confirmLabel: "Supprimer définitivement",
 *     alternative: { label: "Masquer plutôt" },   // facultatif
 *   })
 *   if (choix === true) supprimer()
 *   if (choix === "alt") masquer()
 *
 * <ConfirmHost/> est monté une seule fois par components/admin/admin-shell.tsx.
 */
import { useEffect, useState } from "react"
import { AlertTriangle, EyeOff } from "lucide-react"
import {
  AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export interface ConfirmOptions {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** true (défaut) : bouton rouge, pour les actions irréversibles. */
  destructive?: boolean
  /** Deuxième choix, par exemple « Masquer plutôt » à la place d'une suppression. */
  alternative?: { label: string }
}

type Result = boolean | "alt"
type Pending = ConfirmOptions & { resolve: (r: Result) => void }

let push: ((p: Pending) => void) | null = null

export function askConfirm(opts: ConfirmOptions): Promise<Result> {
  return new Promise((resolve) => {
    if (!push) {
      // Filet de sécurité si le cadre admin n'est pas monté
      resolve(window.confirm(opts.title))
      return
    }
    push({ ...opts, resolve })
  })
}

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null)

  useEffect(() => {
    push = setPending
    return () => { push = null }
  }, [])

  const close = (r: Result) => {
    pending?.resolve(r)
    setPending(null)
  }

  const destructive = pending?.destructive ?? true

  return (
    <AlertDialog open={!!pending} onOpenChange={(o) => { if (!o) close(false) }}>
      <AlertDialogContent className="border-border bg-card">
        {pending && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-start gap-2.5 font-display text-2xl font-normal">
                {destructive && <AlertTriangle className="mt-1 h-5 w-5 shrink-0 text-[var(--rouge-texte)]" />}
                {pending.title}
              </AlertDialogTitle>
              {pending.description && (
                <AlertDialogDescription asChild>
                  <div className="text-sm leading-relaxed text-muted-foreground">{pending.description}</div>
                </AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel onClick={() => close(false)}>{pending.cancelLabel ?? "Annuler"}</AlertDialogCancel>
              {pending.alternative && (
                <Button variant="outline" onClick={() => close("alt")}>
                  <EyeOff className="h-4 w-4" />
                  {pending.alternative.label}
                </Button>
              )}
              <Button variant={destructive ? "destructive" : "default"} onClick={() => close(true)} autoFocus>
                {pending.confirmLabel ?? (destructive ? "Supprimer définitivement" : "Confirmer")}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
