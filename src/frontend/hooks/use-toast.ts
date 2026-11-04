'use client'

/**
 * Compatibilité : ancienne API `toast({ title, description, variant })`.
 *
 * Avant, ces messages passaient par un système (Radix Toast) qui n'était monté
 * nulle part : ils ne s'affichaient jamais. Ils sont désormais transmis à Sonner,
 * le même système que `notify` (lib/admin-notify.ts) :
 *   - variant "destructive" → message d'échec, reste affiché jusqu'à fermeture ;
 *   - sinon → message de succès.
 * Les pages passent progressivement à `notify`, plus complet (liens, Réessayer…).
 */
import type * as React from 'react'
import { toast as sonner } from 'sonner'

type LegacyToast = {
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: 'default' | 'destructive' | null
}

function toast({ title, description, variant }: LegacyToast) {
  // Même message deux fois de suite (double clic, chargement relancé) → une seule notification
  const key =
    typeof title === 'string' && (description === undefined || typeof description === 'string')
      ? `legacy-${variant ?? 'ok'}-${title}-${description ?? ''}`
      : undefined
  const id =
    variant === 'destructive'
      ? sonner.error(title ?? 'Erreur', { id: key, description, duration: Infinity })
      : sonner.success(title ?? 'Enregistré', { id: key, description, duration: 4500 })
  return { id, dismiss: () => sonner.dismiss(id) }
}

function useToast() {
  return { toast, dismiss: (id?: string | number) => sonner.dismiss(id) }
}

export { useToast, toast }
