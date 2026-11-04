"use client"

import { useState } from "react"
import { ArrowRight, CheckCircle } from "lucide-react"
import { API_URL } from "@/lib/api"
import { useLanguage } from "@/contexts/LanguageContext"

/** Inscription a la newsletter (POST /api/newsletter/subscribe, cf. admin Newsletter). */
export function NewsletterForm({ id = "newsletter-email" }: { id?: string }) {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "done">("idle")
  const [error, setError] = useState("")

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setState("sending")
    setError("")
    try {
      const res = await fetch(`${API_URL}/api/newsletter/subscribe`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue")
      setState("done")
      setEmail("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion au serveur")
      setState("idle")
    }
  }

  if (state === "done") {
    return <p className="flex items-center gap-3 text-or-clair"><CheckCircle className="h-5 w-5" />{t("contact.newsletter.success")}</p>
  }
  return (
    <div>
      <form onSubmit={subscribe} className="flex border-b border-or/60 focus-within:border-or-clair">
        <label htmlFor={id} className="sr-only">{t("contact.newsletter.placeholder")}</label>
        <input
          id={id} type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t("contact.newsletter.placeholder")} disabled={state === "sending"}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ivoire placeholder:text-ivoire/35 focus:outline-none"
        />
        <button type="submit" disabled={state === "sending"} className="flex items-center gap-2 px-2 font-caps text-[11px] uppercase tracking-[0.2em] text-or-clair hover:text-ivoire disabled:opacity-50">
          {state === "sending" ? t("contact.newsletter.subscribing") : t("contact.newsletter.subscribe")}
          <ArrowRight className="h-4 w-4" />
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
    </div>
  )
}
