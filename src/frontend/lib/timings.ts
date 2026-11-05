/**
 * Durées de défilement des éléments animés du site, réglables dans l'admin
 * (Paramètres → Rythmes et automatismes). Stockées en secondes dans la table
 * Settings (clé `timing_…`). Une valeur absente ou invalide reprend le défaut.
 */
export const TIMINGS = {
  timing_hero_slide: { label: "Diaporama plein écran (haut de l'accueil)", where: "Mode « Diaporama » : durée de chaque diapositive.", def: 8 },
  timing_book_fan: { label: "Éventail de livres", where: "Mode « Message + livres » : passage d'un livre à l'autre.", def: 5 },
  timing_featured: { label: "À la une", where: "Temps avant que l'annonce suivante passe en grand.", def: 7 },
  timing_countdown_banner: { label: "Bandeau des comptes à rebours", where: "Alternance entre plusieurs comptes à rebours en cours.", def: 8 },
  timing_testimonials: { label: "Témoignages", where: "Page « Mieux nous connaître » : passage d'un témoignage à l'autre.", def: 7 },
  timing_gallery: { label: "Galerie « photo par photo »", where: "Page Galerie : défilement automatique des photos.", def: 5 },
  timing_photo_slideshow: { label: "Diaporamas de photos", where: "Aperçu de la galerie (accueil), bande internationale (Temps forts) et fonds des en-têtes de pages.", def: 5 },
  timing_books_banner: { label: "Bannière de la page Livres", where: "Livres et tracts mis en avant en haut de la page Livres.", def: 7 },
} as const

export type TimingKey = keyof typeof TIMINGS

export const TIMING_MIN = 3
export const TIMING_MAX = 30

/** Secondes valides pour une clé (bornes 3–30 s, sinon la valeur par défaut). */
export function timingSeconds(key: TimingKey, raw: string | number | null | undefined): number {
  const n = typeof raw === "number" ? raw : parseFloat(String(raw ?? ""))
  if (!Number.isFinite(n) || n < TIMING_MIN || n > TIMING_MAX) return TIMINGS[key].def
  return Math.round(n * 2) / 2 // au demi-seconde près
}

/** Toutes les durées, en millisecondes, à partir des paramètres { clé: valeur }. */
export function parseTimings(settings: Record<string, string>): Record<TimingKey, number> {
  const out = {} as Record<TimingKey, number>
  for (const key of Object.keys(TIMINGS) as TimingKey[]) out[key] = timingSeconds(key, settings[key]) * 1000
  return out
}

export const DEFAULT_TIMINGS = parseTimings({})
