"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Clock, Info, Loader2, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { API_URL } from "@/lib/api"
import { clearSession, getToken, tokenExpired, translateError } from "@/lib/admin-api"

type Banner = { kind: "expire" | "deconnecte"; text: string } | null

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<Banner>(null)
  const router = useRouter()

  useEffect(() => {
    // Message laissé par une redirection (session expirée, déconnexion)
    const params = new URLSearchParams(window.location.search)
    if (params.has("expire")) setBanner({ kind: "expire", text: "Votre session a expiré. Reconnectez-vous pour continuer : rien de ce qui était enregistré n'est perdu." })
    else if (params.has("deconnecte")) setBanner({ kind: "deconnecte", text: "Vous êtes déconnecté." })

    // Déjà connecté avec un jeton valide → tableau de bord
    const token = getToken()
    if (token && !tokenExpired(token)) router.replace("/admin/dashboard")
    else if (token) clearSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      let response: Response
      try {
        response = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })
      } catch {
        throw new Error("Serveur injoignable : vérifiez votre connexion (ou que le serveur est démarré).")
      }
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(translateError(data.error || "", response.status).message)
      }

      localStorage.setItem("adminToken", data.token)
      localStorage.setItem("adminData", JSON.stringify(data.admin))
      router.push("/admin/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible")
      setLoading(false)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center px-4 py-12">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="h-20 w-auto" alt="CMCI Belgique" />
          <span className="eyebrow mt-6 flex items-center gap-3 text-or">
            <span className="h-px w-8 bg-or" aria-hidden />
            Administration
            <span className="h-px w-8 bg-or" aria-hidden />
          </span>
          <h1 className="mt-3 font-display text-4xl text-foreground">CMCI Belgique</h1>
          <p className="mt-2 text-sm text-muted-foreground">Connectez-vous pour gérer le contenu du site.</p>
        </div>

        {banner && (
          <div
            role="status"
            className={`mb-4 flex gap-2.5 rounded-lg border px-4 py-3 text-sm ${banner.kind === "expire" ? "border-amber-500/50 bg-amber-500/10" : "border-border bg-card"}`}
          >
            {banner.kind === "expire" ? <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-or" />}
            <span>{banner.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-lg" noValidate={false}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="admin@cmci.be"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div role="alert" className="flex gap-2.5 rounded-md border border-[var(--rouge)]/50 bg-[var(--rouge)]/10 px-3 py-2.5 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rouge-texte)]" />
              <span>{error}</span>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading ? "Connexion…" : "Se connecter"}
          </Button>
        </form>
      </div>
    </main>
  )
}
