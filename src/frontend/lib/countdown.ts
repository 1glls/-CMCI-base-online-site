/**
 * Comptes a rebours (modele Countdown du backend) : phase et decompte.
 * Partage par l'admin (apercu), le bandeau du site et le bloc d'accueil.
 */

export interface Countdown {
  id: string
  title: string
  subtitle: string | null
  startsAt: string
  endsAt: string
  location: string | null
  schedule: string | null
  info: string | null
  linkUrl: string | null
  linkLabel: string | null
  image: string | null
  showBanner: boolean
  showHome: boolean
  priority: number
  status: string
}

/** « a venir » : decompte jusqu'au debut ; « en cours » : jusqu'a la fin. */
export type CountdownPhase = 'upcoming' | 'running' | 'ended'

export function phaseOf(c: Pick<Countdown, 'startsAt' | 'endsAt'>, now: Date): CountdownPhase {
  if (now < new Date(c.startsAt)) return 'upcoming'
  if (now < new Date(c.endsAt)) return 'running'
  return 'ended'
}

export function targetOf(c: Pick<Countdown, 'startsAt' | 'endsAt'>, now: Date): Date {
  return phaseOf(c, now) === 'upcoming' ? new Date(c.startsAt) : new Date(c.endsAt)
}

/** Avancement de 0 a 1 de la periode en cours (0 avant le debut). */
export function progressOf(c: Pick<Countdown, 'startsAt' | 'endsAt'>, now: Date): number {
  const start = new Date(c.startsAt).getTime()
  const end = new Date(c.endsAt).getTime()
  if (end <= start) return 1
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)))
}

export interface Remaining { years: number; months: number; days: number; hours: number; mins: number; secs: number }

/**
 * Temps restant en unites calendaires (annees et mois reels, pas 365 jours) :
 * « 4 ans 1 mois » se lit comme l'attend le visiteur.
 */
export function remaining(target: Date, now: Date): Remaining {
  if (now >= target) return { years: 0, months: 0, days: 0, hours: 0, mins: 0, secs: 0 }
  let years = target.getFullYear() - now.getFullYear()
  let months = target.getMonth() - now.getMonth()
  let days = target.getDate() - now.getDate()
  let hours = target.getHours() - now.getHours()
  let mins = target.getMinutes() - now.getMinutes()
  let secs = target.getSeconds() - now.getSeconds()
  if (secs < 0) { secs += 60; mins-- }
  if (mins < 0) { mins += 60; hours-- }
  if (hours < 0) { hours += 24; days-- }
  if (days < 0) { days += new Date(target.getFullYear(), target.getMonth(), 0).getDate(); months-- }
  if (months < 0) { months += 12; years-- }
  return { years, months, days, hours, mins, secs }
}

/**
 * Unites a afficher : on masque les unites de tete nulles (pas « 0 an 0 mois »)
 * tout en gardant au moins jours/heures/minutes/secondes.
 */
export function visibleUnits(r: Remaining): (keyof Remaining)[] {
  const all: (keyof Remaining)[] = ['years', 'months', 'days', 'hours', 'mins', 'secs']
  const first = r.years > 0 ? 0 : r.months > 0 ? 1 : 2
  return all.slice(first)
}
