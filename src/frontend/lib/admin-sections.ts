/**
 * Liste unique des sections de l'administration.
 *
 * Sert au tableau de bord (tuiles), au menu du haut et aux en-têtes de page
 * (encadré « Où ça s'affiche » + bouton « Voir sur le site »). Pour ajouter
 * ou renommer une section, c'est ici et nulle part ailleurs.
 */
import type { LucideIcon } from "lucide-react"
import {
  BookOpen, Calendar, Church, ClipboardList, DatabaseBackup, FileText, Image, Languages,
  Layers, LayoutTemplate, Library, Mail, MapPin, Megaphone, MessageSquare, Settings, Settings2,
  Share2, Tags, Timer,
} from "lucide-react"

export type AdminGroup = "content" | "publications" | "communication" | "system"

export interface AdminSection {
  key: string
  title: string
  href: string
  icon: LucideIcon
  group: AdminGroup
  /** Une ligne pour la tuile du tableau de bord. */
  description: string
  /** Où le contenu apparaît sur le site public (phrase complète). */
  where: string
  /** Lien public le plus parlant (bouton « Voir sur le site »). */
  publicHref?: string
  /** Liste admin à compter sur le tableau de bord (éléments avec un champ status). */
  listUrl?: string
  /** Nom de la ressource pour la route « Masquer / Afficher » (PATCH /api/<resource>/:id/status). */
  resource?: string
}

export const ADMIN_GROUPS: { key: AdminGroup; title: string; hint: string; icon: LucideIcon }[] = [
  { key: "content", title: "Contenu du site", hint: "Ce que les visiteurs voient sur les pages", icon: Layers },
  { key: "publications", title: "Publications", hint: "Livres, tracts et leurs catégories", icon: Library },
  { key: "communication", title: "Communication", hint: "Newsletter, formulaires, réseaux sociaux", icon: Megaphone },
  { key: "system", title: "Système", hint: "Réglages, traductions, sauvegardes", icon: Settings2 },
]

export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: "hero", title: "Haut de l'accueil", href: "/admin/hero", icon: LayoutTemplate, group: "content",
    description: "Diapositives du haut de la page d'accueil",
    where: "En haut de la page d'accueil. En mode « Diaporama », les diapositives défilent en plein écran ; en mode « Message + livres », elles passent dans le bandeau « À la une » juste en dessous (le mode se choisit dans Paramètres).",
    publicHref: "/#accueil", listUrl: "/api/hero/all", resource: "hero",
  },
  {
    key: "countdowns", title: "Comptes à rebours", href: "/admin/countdowns", icon: Timer, group: "content",
    description: "Grands rendez-vous : décompte et infos pratiques",
    where: "Bandeau en haut de toutes les pages pendant le décompte (si « bandeau » est coché) et page Temps forts.",
    publicHref: "/temps-forts", listUrl: "/api/countdowns/all", resource: "countdowns",
  },
  {
    key: "events", title: "Événements", href: "/admin/events", icon: Calendar, group: "content",
    description: "Agenda de l'église",
    where: "Agenda de la page d'accueil (section Événements). Un événement peut aussi être lié à une diapositive du haut de l'accueil et envoyé dans la newsletter.",
    publicHref: "/#evenements", listUrl: "/api/events/all", resource: "events",
  },
  {
    key: "testimonials", title: "Témoignages", href: "/admin/testimonials", icon: MessageSquare, group: "content",
    description: "Témoignages des fidèles",
    where: "Page « Mieux nous connaître », section Témoignages (ils ne sont pas sur l'accueil).",
    publicHref: "/mieux-nous-connaitre#temoignages", listUrl: "/api/testimonials/all", resource: "testimonials",
  },
  {
    key: "gallery", title: "Galerie", href: "/admin/gallery", icon: Image, group: "content",
    description: "Photos de la vie de l'église",
    where: "Page Galerie, aperçu en bas de l'accueil et page Temps forts. La photo la plus récente sert aussi de fond à la section Vision de « Mieux nous connaître ».",
    publicHref: "/galerie", listUrl: "/api/gallery/all", resource: "gallery",
  },
  {
    key: "ministries", title: "Ministères", href: "/admin/ministries", icon: Church, group: "content",
    description: "Les ministères de l'église",
    where: "Page d'accueil, section Ministères.",
    publicHref: "/#ministeres", listUrl: "/api/ministries/all", resource: "ministries",
  },
  {
    key: "assemblies", title: "Assemblées", href: "/admin/assemblies", icon: MapPin, group: "content",
    description: "Lieux de culte en Belgique",
    where: "Page d'accueil : carte et liste des Assemblées. Les adresses sont aussi transmises à Google (fiche de l'église).",
    publicHref: "/#assemblees", listUrl: "/api/assemblies/all", resource: "assemblies",
  },
  {
    key: "books", title: "Livres", href: "/admin/books", icon: BookOpen, group: "publications",
    description: "Catalogue synchronisé depuis ztfbooks",
    where: "Page Livres et fiche de chaque livre. Les livres choisis (✦) apparaissent aussi en éventail en haut de l'accueil.",
    publicHref: "/livres",
  },
  {
    key: "tracts", title: "Tracts", href: "/admin/tracts", icon: FileText, group: "publications",
    description: "Tracts imprimés et leurs langues",
    where: "Page Livres (tracts) et page dédiée de chaque tract (/t/…), ouverte par le QR code imprimé.",
    publicHref: "/livres", listUrl: "/api/tracts/all", resource: "tracts",
  },
  {
    key: "categories", title: "Catégories", href: "/admin/categories", icon: Tags, group: "publications",
    description: "Classer livres et tracts",
    where: "Filtres de la page Livres (pour les livres et les tracts).",
    publicHref: "/livres",
  },
  {
    key: "newsletter", title: "Newsletter", href: "/admin/newsletter", icon: Mail, group: "communication",
    description: "Abonnés et envois",
    where: "Formulaire d'inscription dans le pied de toutes les pages. Les envois partent par e-mail à tous les abonnés actifs.",
    publicHref: "/#contact",
  },
  {
    key: "forms", title: "Formulaires", href: "/admin/forms", icon: ClipboardList, group: "communication",
    description: "Inscriptions et réponses",
    where: "Chaque formulaire a sa propre page /formulaires/… à partager (lien, QR code) : il n'apparaît pas dans le menu du site.",
    listUrl: "/api/forms/all", resource: "forms",
  },
  {
    key: "social", title: "Réseaux sociaux", href: "/admin/social-media", icon: Share2, group: "communication",
    description: "Comptes reliés et publications à valider",
    where: "Les publications que vous validez rejoignent les annonces du haut de l'accueil (« À la une », ou le diaporama plein écran selon le mode choisi dans Paramètres), avec la mention « Sur nos réseaux ». La plus récente passe en premier. Les vidéos YouTube se regardent directement sur le site. Les publications en attente, refusées ou masquées ne sont jamais montrées.",
    publicHref: "/",
  },
  {
    key: "settings", title: "Paramètres", href: "/admin/settings", icon: Settings, group: "system",
    description: "Coordonnées, réseaux, mode d'accueil",
    where: "Coordonnées et liens des réseaux : pied de toutes les pages et section Contact de « Mieux nous connaître ». Mode d'accueil : haut de la page d'accueil.",
    publicHref: "/mieux-nous-connaitre#contact",
  },
  {
    key: "translations", title: "Traductions", href: "/admin/translations", icon: Languages, group: "system",
    description: "Traduction automatique EN / NL",
    where: "Versions anglaise et néerlandaise de tout le contenu (sélecteur de langue du site).",
  },
  {
    key: "backup", title: "Sauvegardes", href: "/admin/backup", icon: DatabaseBackup, group: "system",
    description: "Copies de la base de données",
    where: "Interne : rien n'est visible sur le site.",
  },
]

export function sectionFor(pathname: string): AdminSection | undefined {
  return ADMIN_SECTIONS.find((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))
}
