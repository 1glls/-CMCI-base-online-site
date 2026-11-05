"use client"

/**
 * Publications des réseaux sociaux dans le haut de l'accueil.
 *
 * Les publications validées dans l'admin (Réseaux sociaux) deviennent des
 * « annonces » comme les diapositives de l'admin Section Hero : elles passent
 * dans « À la une » (mode Message + livres) et dans le diaporama plein écran,
 * avec une mention « Sur nos réseaux · YouTube ». La plus récente passe en
 * premier, puis les annonces, puis les autres publications.
 *
 * La fusion se fait dans le navigateur (mergeSocialSlides) : les annonces sont
 * rechargées au changement de langue, les publications doivent y survivre.
 */
import { useState } from "react"
import { ArrowUpRight, Facebook, Instagram, Play, Youtube } from "lucide-react"
import { FaTiktok } from "react-icons/fa"
import { useLanguage } from "@/contexts/LanguageContext"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { Slide } from "./hero"

export type SocialPlatform = "youtube" | "facebook" | "instagram" | "tiktok"

/** Publication telle que renvoyée par GET /api/social-media. */
export interface SocialPost {
  id: string
  platform: SocialPlatform
  title: string | null
  content: string | null
  mediaUrl: string | null
  thumbnail: string | null
  author: string | null
  publishedAt: string | null
  isVideo: boolean
}

export interface SlideSocial {
  platform: SocialPlatform
  mediaUrl: string | null
  isVideo: boolean
  publishedAt: string | null
}

export const SOCIAL_ICONS = { youtube: Youtube, facebook: Facebook, instagram: Instagram, tiktok: FaTiktok }
export const SOCIAL_NAMES = { youtube: "YouTube", facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" }
const LOCALE: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" }

/** Identifiant d'une vidéo YouTube à partir de son lien. */
export function youtubeId(url: string | null | undefined) {
  if (!url) return null
  const m = url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/) || url.match(/shorts\/([\w-]{11})/)
  return m ? m[1] : null
}

/** Retire les hashtags en fin de texte (« … ce dimanche #bruxelles #jesus »). */
export function cleanTitle(text: string) {
  const t = text.replace(/(\s*#[\p{L}\p{N}_]+)+\s*$/u, "").trim()
  return t || text
}

const excerpt = (text: string, max = 170) => {
  const t = cleanTitle(text.replace(/\s+/g, " ").trim())
  return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, "")}…`
}

/** Une publication devient une annonce du haut de l'accueil. */
export function socialToSlide(p: SocialPost): Slide {
  const title = cleanTitle(p.title || p.content || SOCIAL_NAMES[p.platform])
  const body = p.content && p.content.trim() !== (p.title || "").trim() ? excerpt(p.content) : ""
  return {
    id: `social-${p.id}`,
    title,
    subtitle: body,
    image: p.thumbnail,
    imageMobile: null,
    social: { platform: p.platform, mediaUrl: p.mediaUrl, isVideo: p.isVideo, publishedAt: p.publishedAt },
  }
}

/**
 * Ordre validé : la publication la plus récente, puis les annonces (ordre de
 * l'admin), puis les autres publications, au plus `count` publications.
 */
export function mergeSocialSlides(slides: Slide[], posts: SocialPost[], count: number): Slide[] {
  if (!count || posts.length === 0) return slides
  const recent = [...posts]
    .sort((a, b) => (b.publishedAt ? Date.parse(b.publishedAt) : 0) - (a.publishedAt ? Date.parse(a.publishedAt) : 0))
    .slice(0, count)
    .map(socialToSlide)
  const [first, ...others] = recent
  return [first, ...slides, ...others]
}

/** Mention « ◆ Sur nos réseaux · [icône] YouTube · 3 nov. 2026 ». */
export function SocialBadge({ social, className = "" }: { social: SlideSocial; className?: string }) {
  const { t, language } = useLanguage()
  const Icon = SOCIAL_ICONS[social.platform]
  const date = social.publishedAt
    ? new Date(social.publishedAt).toLocaleDateString(LOCALE[language] || "fr-BE", { day: "numeric", month: "short", year: "numeric" })
    : null
  return (
    <p className={`eyebrow flex flex-wrap items-center gap-x-2 gap-y-1 !text-[10px] text-or-clair ${className}`}>
      <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-rouge" />
      {t("home2.featured.social")}
      <span aria-hidden className="text-ivoire/35">·</span>
      <span className="inline-flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{SOCIAL_NAMES[social.platform]}</span>
      {date && (<><span aria-hidden className="text-ivoire/35">·</span><span className="text-ivoire/60">{date}</span></>)}
    </p>
  )
}

/** Vrai si l'annonce est une vidéo YouTube lisible sur place. */
export const isPlayable = (s?: SlideSocial | null) => !!s && s.platform === "youtube" && !!youtubeId(s.mediaUrl)

/**
 * Bouton d'action d'une annonce réseau : « Regarder » (lecteur intégré pour
 * YouTube) ou « Voir sur Facebook / Instagram / TikTok » (nouvel onglet).
 */
export function SocialAction({ social, onPlay, big = false }: { social: SlideSocial; onPlay: () => void; big?: boolean }) {
  const { t } = useLanguage()
  const cls = big
    ? "inline-flex items-center gap-3 bg-or px-7 py-4 font-caps text-xs uppercase tracking-[0.2em] text-nuit hover:bg-or-clair"
    : "inline-flex items-center gap-1.5 border-b border-or pb-0.5 font-caps text-[10px] uppercase tracking-[0.2em] text-or-clair hover:text-ivoire"
  if (isPlayable(social)) {
    return (
      <button type="button" onClick={onPlay} className={cls}>
        <Play className={big ? "h-4 w-4" : "h-3.5 w-3.5"} />{t("home2.featured.watch")}
      </button>
    )
  }
  if (!social.mediaUrl) return null
  return (
    <a href={social.mediaUrl} target="_blank" rel="noopener noreferrer" className={cls}>
      {t("home2.featured.openOn")} {SOCIAL_NAMES[social.platform]} <ArrowUpRight className={big ? "h-4 w-4" : "h-3.5 w-3.5"} />
    </a>
  )
}

/**
 * Lecteur YouTube intégré (youtube-nocookie, chargé seulement à l'ouverture).
 *   const player = useVideoPlayer();  player.open(slide);  …  {player.dialog}
 */
export function useVideoPlayer() {
  const [video, setVideo] = useState<{ id: string; title: string } | null>(null)
  const open = (s: Slide) => {
    const id = youtubeId(s.social?.mediaUrl)
    if (id) setVideo({ id, title: s.title })
  }
  const dialog = (
    <Dialog open={video !== null} onOpenChange={(o) => !o && setVideo(null)}>
      <DialogContent className="max-w-[min(92vw,1100px)] border-or/30 bg-[#000] p-0 text-ivoire sm:max-w-[min(92vw,1100px)] [&>button]:text-[#f6f1e7]">
        <DialogTitle className="sr-only">{video?.title || "YouTube"}</DialogTitle>
        {video && (
          <div className="aspect-video w-full">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
  return { open, dialog }
}
