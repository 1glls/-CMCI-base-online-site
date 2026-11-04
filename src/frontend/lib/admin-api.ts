"use client"

/**
 * Appels à l'API depuis l'administration.
 *
 * Toutes les pages admin passent par `adminFetch` :
 *   - ajoute le jeton de connexion ;
 *   - session expirée (401) → déconnexion propre + retour au login avec un message ;
 *   - lit la réponse sans planter (JSON, texte ou vide) ;
 *   - en cas d'échec, lève une `AdminApiError` dont le message est en français
 *     et compréhensible : aucun échec ne doit plus passer inaperçu.
 */
import { API_URL } from "@/lib/api"

export class AdminApiError extends Error {
  status: number
  detail?: string
  constructor(message: string, status: number, detail?: string) {
    super(message)
    this.name = "AdminApiError"
    this.status = status
    this.detail = detail
  }
}

const TOKEN_KEY = "adminToken"
const ADMIN_KEY = "adminData"

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function getAdmin(): { name?: string; email?: string } | null {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(ADMIN_KEY)
  } catch { /* stockage indisponible */ }
}

/** Le jeton (JWT) contient sa date d'expiration : on la lit sans appeler le serveur. */
export function tokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now()
  } catch {
    return false
  }
}

let redirecting = false
/** Session expirée : on nettoie et on renvoie au login, qui affichera un message. */
export function expireSession() {
  clearSession()
  if (redirecting || typeof window === "undefined") return
  redirecting = true
  window.location.href = "/admin?expire=1"
}

/* ----------------------- traduction des erreurs serveur ---------------------- */

const TRADUCTIONS: [RegExp, string][] = [
  [/invalid token|no token provided|jwt expired/i, "Session expirée, reconnectez-vous."],
  [/access denied/i, "Accès refusé : ce compte n'est pas administrateur."],
  [/invalid credentials/i, "Email ou mot de passe incorrect."],
  [/file too large|LIMIT_FILE_SIZE/i, "Fichier trop lourd : réduisez sa taille et réessayez."],
  [/not found/i, "Élément introuvable : il a peut-être déjà été supprimé."],
  [/unique constraint|already exists/i, "Cette valeur existe déjà."],
  [/only image|images? (are )?allowed|invalid file type|unsupported/i, "Format de fichier non accepté."],
  [/failed to fetch|networkerror|load failed/i, "Serveur injoignable : vérifiez votre connexion."],
]

const PAR_CODE: Record<number, string> = {
  400: "Les informations envoyées ont été refusées.",
  403: "Accès refusé.",
  404: "Élément introuvable : il a peut-être déjà été supprimé.",
  409: "Conflit : cette valeur est déjà utilisée.",
  413: "Fichier trop lourd : réduisez sa taille et réessayez.",
  429: "Trop de demandes, patientez un instant puis réessayez.",
  502: "Le service externe n'a pas répondu, réessayez plus tard.",
}

/** Un message déjà rédigé en français par le serveur est gardé tel quel. */
function looksFrench(s: string) {
  return /[éèêàùçôî]|\b(le|la|les|du|des|est|requis|introuvable|invalide|impossible|deja|doit)\b/i.test(s)
}

export function translateError(raw: string, status: number): { message: string; detail?: string } {
  const text = (raw || "").trim()
  if (text && looksFrench(text) && !/something went wrong/i.test(text)) return { message: text }
  for (const [re, fr] of TRADUCTIONS) if (re.test(text)) return { message: fr, detail: text }
  const generic = PAR_CODE[status] || (status >= 500 ? "Erreur du serveur : l'action n'a pas été enregistrée." : "L'action a échoué.")
  return { message: generic, detail: text || undefined }
}

/** Message lisible pour n'importe quelle erreur attrapée dans un `catch`. */
export function errorText(e: unknown): string {
  if (e instanceof Error) return e.message
  return "Erreur inconnue"
}

/* --------------------------------- adminFetch -------------------------------- */

type AdminInit = Omit<RequestInit, "body"> & {
  /** Corps envoyé en JSON (Content-Type ajouté automatiquement). */
  json?: unknown
  /** Corps brut (FormData pour les envois d'images). */
  body?: BodyInit | null
}

export async function adminFetch<T = any>(path: string, init: AdminInit = {}): Promise<T> {
  const { json, ...rest } = init
  const headers = new Headers(rest.headers)
  const token = getToken()
  if (token) headers.set("Authorization", `Bearer ${token}`)
  let body = rest.body
  if (json !== undefined) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(json)
  }

  let res: Response
  try {
    res = await fetch(path.startsWith("http") ? path : `${API_URL}${path}`, { ...rest, headers, body })
  } catch (e) {
    throw new AdminApiError(
      "Serveur injoignable : vérifiez votre connexion (ou que le serveur est démarré).",
      0,
      errorText(e),
    )
  }

  const text = await res.text()
  let data: any = null
  if (text) {
    try { data = JSON.parse(text) } catch { data = text }
  }

  if (res.status === 401) {
    expireSession()
    throw new AdminApiError("Session expirée, reconnectez-vous.", 401)
  }
  if (!res.ok) {
    // Route inconnue du serveur (page HTML « Cannot PATCH /api/... ») : le backend
    // tourne avec une ancienne version du code. Arrive quand on déploie sans
    // redémarrer le serveur (pm2 restart cmci-backend).
    if (res.status === 404 && typeof data === "string" && /Cannot (GET|POST|PUT|PATCH|DELETE) /.test(data)) {
      throw new AdminApiError(
        "Le serveur n'est pas à jour : cette fonction n'existe pas encore sur le backend. Il faut le redémarrer (pm2 restart cmci-backend).",
        404,
        data.match(/Cannot [A-Z]+ [^<]+/)?.[0],
      )
    }
    const raw = data && typeof data === "object"
      ? [data.error, data.message].filter(Boolean).join(" — ")
      : typeof data === "string" && !data.trimStart().startsWith("<") ? data.slice(0, 300) : ""
    const { message, detail } = translateError(raw, res.status)
    throw new AdminApiError(message, res.status, detail)
  }
  return data as T
}

/** Liste attendue : renvoie toujours un tableau (jamais d'objet d'erreur qui ferait planter `.map`). */
export async function adminList<T = any>(path: string): Promise<T[]> {
  const data = await adminFetch<unknown>(path)
  return Array.isArray(data) ? (data as T[]) : []
}

/* ------------------------------ Masquer / Afficher ----------------------------- */

export type Visibility = "published" | "draft" | "closed"

/** Change uniquement la visibilité d'un élément (route PATCH /api/<ressource>/:id/status). */
export function setVisibility(resource: string, id: string, status: Visibility) {
  return adminFetch(`/api/${resource}/${id}/status`, { method: "PATCH", json: { status } })
}
