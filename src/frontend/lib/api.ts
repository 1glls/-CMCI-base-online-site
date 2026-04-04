/**
 * Configuration de l'API
 */

// En production, utiliser l'API de production par défaut
const DEFAULT_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.cmcibelgique.org'
  : 'http://localhost:5000'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL

/**
 * Helper pour construire les URLs d'images uploadées
 */
export function getImageUrl(imagePath: string | null): string {
  if (!imagePath) {
    return '/images/event-conference.jpg' // Image par défaut
  }
  
  // Si l'image commence déjà par http, la retourner telle quelle
  if (imagePath.startsWith('http')) {
    return imagePath
  }
  
  // Sinon, construire l'URL complète
  return `${API_URL}${imagePath}`
}
