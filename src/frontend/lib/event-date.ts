/**
 * Les dates d'evenements sont saisies en texte libre dans l'admin
 * (« Dimanche 12 juillet 2026 », « 14 fevrier 2026 », « 08 MAR 2026 »,
 * « 2026-03-08 »).
 * On en extrait jour/mois/annee pour trier et afficher ; si la lecture
 * echoue, l'evenement garde son texte tel quel.
 */

const MONTHS: Record<string, number> = {
  janvier: 0, fevrier: 1, mars: 2, avril: 3, mai: 4, juin: 5, juillet: 6, aout: 7,
  septembre: 8, octobre: 9, novembre: 10, decembre: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5, july: 6, august: 7,
  september: 8, october: 9, november: 10, december: 11,
  januari: 0, februari: 1, maart: 2, mei: 4, juni: 5, juli: 6, augustus: 7,
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

export function parseEventDate(text: string): Date | null {
  const t = fold(text || "")
  // Formats numeriques : 2026-03-08 ou 08/03/2026 (08.03.2026, 08-03-2026)
  const iso = t.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
  const num = t.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](20\d{2})\b/)
  if (num) return new Date(Number(num[3]), Number(num[2]) - 1, Number(num[1]))

  // Format texte : jour + mois (complet ou abrege : « fev », « sept », « MAR ») + annee
  const day = t.match(/\b(\d{1,2})\b/)
  const year = t.match(/\b(20\d{2})\b/)
  const words = t.match(/\p{L}+/gu) || []
  let month: number | undefined
  for (const w of words) {
    if (w.length < 3) continue
    const hit = Object.keys(MONTHS).find((m) => m === w || m.startsWith(w))
    if (hit) { month = MONTHS[hit]; break }
  }
  if (!day || !year || month === undefined) return null
  return new Date(Number(year[1]), month, Number(day[1]))
}

/** Evenements a venir (du plus proche au plus lointain) puis passes (du plus recent). */
export function splitEvents<T extends { date: string }>(events: T[], now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dated = events.map((e) => ({ e, d: parseEventDate(e.date) }))
  const upcoming = dated.filter((x) => !x.d || x.d >= today).sort((a, b) => (a.d?.getTime() ?? Infinity) - (b.d?.getTime() ?? Infinity))
  const past = dated.filter((x) => x.d && x.d < today).sort((a, b) => b.d!.getTime() - a.d!.getTime())
  return { upcoming, past }
}
