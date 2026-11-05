/**
 * Chargement des donnees cote serveur (pages rendues pour Google).
 *
 * Les composants publics chargent leurs donnees dans le navigateur : sans
 * ce pre-chargement, le HTML recu par les moteurs de recherche ne contient
 * que « Chargement... ». En cas d'echec de l'API on renvoie `fallback`,
 * le composant retombe alors sur son propre chargement client.
 */
import { API_URL } from '@/lib/api'

export async function fetchApi<T>(path: string, fallback: T, revalidate = 300): Promise<T> {
  try {
    const res = await fetch(`${API_URL}${path}`, { next: { revalidate } })
    if (!res.ok) return fallback
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

/** Reglages admin (`/api/settings`) sous forme { cle: valeur }. */
export async function fetchSettings(): Promise<Record<string, string>> {
  // 60 s : un reglage modifie dans l'admin est visible sur le site en moins d'une minute
  const list = await fetchApi<{ key: string; value: string }[]>('/api/settings', [], 60)
  if (!Array.isArray(list)) return {}
  return Object.fromEntries(list.map((s) => [s.key, s.value]))
}
