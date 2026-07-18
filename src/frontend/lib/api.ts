/**
 * Configuration de l'API
 */

// En production, utiliser l'API de production par défaut
const DEFAULT_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.cmcibelgique.org'
  : 'http://localhost:5000'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL

/**
 * Helper pour construire les URLs d'images.
 *
 * La base contient trois familles de chemins :
 *   - `/uploads/...`  fichiers servis par le backend  -> préfixer l'API
 *   - `http(s)://...` URLs externes (Unsplash, etc.)  -> laisser tel quel
 *   - `/images/...`   assets locaux de `public/`      -> laisser tel quel
 *
 * Préfixer l'API sur tout chemin non-http casserait les assets locaux.
 */
export function getImageUrl(
  imagePath: string | null | undefined,
  fallback = '/placeholder.svg'
): string {
  if (!imagePath) return fallback

  if (imagePath.startsWith('http')) return imagePath
  if (imagePath.startsWith('/uploads')) return `${API_URL}${imagePath}`

  return imagePath
}

/**
 * Helper pour les fichiers uploadés (PDF, etc.).
 * Pas d'image de repli : une chaîne vide signale l'absence de fichier.
 */
export function getFileUrl(filePath: string | null | undefined): string {
  if (!filePath) return ''
  if (filePath.startsWith('http')) return filePath
  return `${API_URL}${filePath}`
}
