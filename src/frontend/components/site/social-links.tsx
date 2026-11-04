import { Facebook, Instagram, Youtube } from "lucide-react"
import { FaTelegram, FaTiktok, FaWhatsapp } from "react-icons/fa"

const NETWORKS = [
  { key: "social_facebook", label: "Facebook", Icon: Facebook },
  { key: "social_instagram", label: "Instagram", Icon: Instagram },
  { key: "social_youtube", label: "YouTube", Icon: Youtube },
  { key: "social_tiktok", label: "TikTok", Icon: FaTiktok },
  { key: "social_telegram", label: "Telegram", Icon: FaTelegram },
  { key: "social_whatsapp", label: "WhatsApp", Icon: FaWhatsapp },
]

const withProtocol = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`)

/** Liens vers les reseaux renseignes dans les reglages admin (les vides sont omis). */
export function SocialLinks({ settings, className = "" }: { settings: Record<string, string>; className?: string }) {
  const links = NETWORKS.filter((n) => settings[n.key] && settings[n.key] !== "#")
  if (links.length === 0) return null
  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {links.map(({ key, label, Icon }) => (
        <a
          key={key} href={withProtocol(settings[key])} target="_blank" rel="noopener noreferrer" aria-label={label}
          className="grid h-11 w-11 rotate-45 place-items-center border border-or/40 text-or-clair transition-colors hover:bg-or hover:text-nuit"
        >
          <Icon className="h-4 w-4 -rotate-45" />
        </a>
      ))}
    </div>
  )
}
