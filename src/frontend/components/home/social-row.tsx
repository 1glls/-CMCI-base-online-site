"use client"

/**
 * « Sur nos réseaux » : rangée des dernières publications validées dans
 * l'admin (YouTube, Facebook, Instagram, TikTok), affichée dans « À la une ».
 * Une vidéo YouTube se regarde sur place (lecteur youtube-nocookie, chargé
 * seulement au clic) ; les autres publications s'ouvrent sur leur réseau.
 */
import { useState } from "react"
import { ArrowUpRight, Facebook, Instagram, Play, Youtube } from "lucide-react"
import { FaTiktok } from "react-icons/fa"
import { getImageUrl } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"
import { Rich } from "@/components/site/rich-text"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export interface SocialPost {
  id: string
  platform: "youtube" | "facebook" | "instagram" | "tiktok"
  title: string | null
  content: string | null
  mediaUrl: string | null
  thumbnail: string | null
  author: string | null
  publishedAt: string | null
  isVideo: boolean
}

const ICONS = { youtube: Youtube, facebook: Facebook, instagram: Instagram, tiktok: FaTiktok }
const NAMES = { youtube: "YouTube", facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" }
const LOCALE: Record<string, string> = { fr: "fr-BE", nl: "nl-BE", en: "en-GB" }
const FALLBACK = "/images/hero-worship.jpg"

/** Identifiant d'une vidéo YouTube à partir de son lien. */
function youtubeId(url: string | null) {
  if (!url) return null
  const m = url.match(/[?&]v=([\w-]{11})/) || url.match(/youtu\.be\/([\w-]{11})/) || url.match(/shorts\/([\w-]{11})/)
  return m ? m[1] : null
}

export function SocialRow({ posts, separated = true }: { posts: SocialPost[]; separated?: boolean }) {
  const { t, language } = useLanguage()
  const [video, setVideo] = useState<SocialPost | null>(null)
  if (posts.length === 0) return null

  const date = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(LOCALE[language] || "fr-BE", { day: "numeric", month: "short", year: "numeric" }) : ""

  return (
    <div className={separated ? "mt-16 border-t border-ivoire/10 pt-8" : "mt-10"}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2 !text-[10px] text-or">
            <span className="h-1.5 w-1.5 rotate-45 bg-rouge" aria-hidden />{t("home2.featured.social")}
          </p>
          <p className="mt-2 text-sm text-ivoire/55">{t("home2.featured.socialHint")}</p>
        </div>
      </div>

      <ul className="mt-6 flex snap-x gap-7 overflow-x-auto pb-3 [scrollbar-color:var(--or)_transparent] [scrollbar-width:thin]">
        {posts.map((p) => {
          const Icon = ICONS[p.platform]
          const yt = p.platform === "youtube" ? youtubeId(p.mediaUrl) : null
          const label = yt ? t("home2.featured.watch") : `${t("home2.featured.openOn")} ${NAMES[p.platform]}`
          const body = (
            <>
              <span className="relative block aspect-video overflow-hidden">
                <img
                  src={getImageUrl(p.thumbnail, FALLBACK)}
                  alt=""
                  loading="lazy"
                  className="fondu-bas h-full w-full object-cover opacity-85 transition duration-700 group-hover:scale-[1.05] group-hover:opacity-100"
                />
                {p.isVideo && (
                  <span aria-hidden className="absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full border border-or/70 bg-nuit/55 text-or-clair backdrop-blur-sm transition-colors group-hover:bg-or group-hover:text-nuit">
                      <Play className="ml-0.5 h-5 w-5" />
                    </span>
                  </span>
                )}
              </span>
              <span className="eyebrow mt-3 flex items-center gap-2 !text-[9px] text-ivoire/55">
                <Icon className="h-3.5 w-3.5 text-or" />{NAMES[p.platform]} · {date(p.publishedAt)}
              </span>
              <span className="mt-2 line-clamp-2 font-display text-lg leading-snug text-ivoire/85 transition-colors group-hover:text-or-clair">
                <Rich text={p.title || p.content || ""} />
              </span>
              <span className="mt-2 inline-flex items-center gap-1.5 font-caps text-[10px] uppercase tracking-[0.2em] text-or-clair">
                {label} <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </>
          )
          return (
            <li key={p.id} className="w-72 shrink-0 snap-start">
              {yt ? (
                <button type="button" onClick={() => setVideo(p)} className="group block w-full text-left">{body}</button>
              ) : (
                <a href={p.mediaUrl || "#"} target="_blank" rel="noopener noreferrer" className="group block">{body}</a>
              )}
            </li>
          )
        })}
      </ul>

      {/* Lecteur YouTube : chargé seulement à l'ouverture (youtube-nocookie) */}
      <Dialog open={video !== null} onOpenChange={(o) => !o && setVideo(null)}>
        <DialogContent className="max-w-[min(92vw,1100px)] border-or/30 bg-[#000] p-0 text-ivoire sm:max-w-[min(92vw,1100px)] [&>button]:text-[#f6f1e7]">
          <DialogTitle className="sr-only">{video?.title || "YouTube"}</DialogTitle>
          {video && (
            <div className="aspect-video w-full">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${youtubeId(video.mediaUrl)}?autoplay=1&rel=0`}
                title={video.title || "YouTube"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
