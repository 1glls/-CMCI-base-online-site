"use client"

/**
 * Cadre commun de toutes les pages /admin (monté par app/admin/layout.tsx) :
 *   - couleurs Nuit & or (classe .admin-nuit, voir app/globals.css) ;
 *   - garde de connexion unique : sans jeton valide → retour au login ;
 *   - barre du haut : logo, menu des sections, « Voir le site », clair/sombre, déconnexion ;
 *   - zone des notifications (Sonner) et des confirmations.
 */
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ChevronDown, ExternalLink, LayoutDashboard, LogOut, Menu } from "lucide-react"
import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Toaster } from "@/components/ui/sonner"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConfirmHost } from "@/components/admin/confirm-dialog"
import { API_URL } from "@/lib/api"
import { clearSession, expireSession, getToken, tokenExpired } from "@/lib/admin-api"
import { ADMIN_GROUPS, ADMIN_SECTIONS, sectionFor } from "@/lib/admin-sections"

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/admin"
  const router = useRouter()
  const isLogin = pathname === "/admin"
  const [ready, setReady] = useState(isLogin)

  // La classe sur <html> colore aussi ce qui s'affiche hors de la page
  // (boîtes de dialogue, menus déroulants, notifications).
  useEffect(() => {
    document.documentElement.classList.add("admin-nuit")
    return () => document.documentElement.classList.remove("admin-nuit")
  }, [])

  // Filet de sécurité pour les pages qui appellent encore `fetch` directement :
  // une réponse 401 (session expirée) de notre API → retour au login avec un message,
  // au lieu d'une page vide ou d'un message d'erreur trompeur.
  useEffect(() => {
    if (isLogin) return
    const original = window.fetch
    window.fetch = async (input, init) => {
      const res = await original(input, init)
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url
      if (res.status === 401 && url.startsWith(API_URL) && !url.includes("/api/auth/")) {
        expireSession()
        // La page part vers le login : on ne rend pas la main à son code,
        // qui afficherait sinon une alerte d'erreur trompeuse pendant la redirection.
        return new Promise<Response>(() => {})
      }
      return res
    }
    return () => { window.fetch = original }
  }, [isLogin])

  useEffect(() => {
    if (isLogin) { setReady(true); return }
    const token = getToken()
    if (!token) { setReady(false); router.replace("/admin"); return }
    if (tokenExpired(token)) { setReady(false); expireSession(); return }
    setReady(true)
  }, [isLogin, pathname, router])

  return (
    <div className="admin-nuit min-h-screen font-sans">
      {!isLogin && <AdminTopBar pathname={pathname} />}
      {ready ? children : (
        <div className="grid min-h-[60vh] place-items-center text-sm text-muted-foreground">Vérification de la session…</div>
      )}
      <Toaster />
      <ConfirmHost />
    </div>
  )
}

function AdminTopBar({ pathname }: { pathname: string }) {
  const router = useRouter()
  const current = sectionFor(pathname)
  const siteHref = current?.publicHref || "/"

  const logout = () => {
    clearSession()
    router.push("/admin?deconnecte=1")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/admin/dashboard" className="flex shrink-0 items-center gap-2.5" title="Tableau de bord">
          <Logo className="h-8 w-auto" alt="" />
          <span className="leading-none">
            <span className="block font-display text-lg text-foreground">CMCI</span>
            <span className="eyebrow block !text-[9px] text-or">Administration</span>
          </span>
        </Link>

        {/* Menu par groupe (ordinateur) */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Sections de l'administration">
          <Link
            href="/admin/dashboard"
            className={`rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-accent ${pathname === "/admin/dashboard" ? "text-or" : "text-foreground/80"}`}
          >
            Tableau de bord
          </Link>
          {ADMIN_GROUPS.map((g) => {
            const items = ADMIN_SECTIONS.filter((s) => s.group === g.key)
            const active = current?.group === g.key
            return (
              <DropdownMenu key={g.key}>
                <DropdownMenuTrigger
                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-sm outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring ${active ? "text-or" : "text-foreground/80"}`}
                >
                  {g.title}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{g.hint}</DropdownMenuLabel>
                  {items.map((s) => (
                    <DropdownMenuItem key={s.key} asChild>
                      <Link href={s.href} className={`flex items-start gap-2.5 ${current?.key === s.key ? "text-or" : ""}`}>
                        <s.icon className="mt-0.5 h-4 w-4 !text-or" />
                        <span>
                          <span className="block text-sm">{s.title}</span>
                          <span className="block text-xs text-muted-foreground">{s.description}</span>
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Menu compact (tablette / mobile) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
              aria-label="Ouvrir le menu des sections"
            >
              <Menu className="h-4 w-4" />
              <span className="max-w-[9rem] truncate">{current?.title ?? "Menu"}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[75vh] w-64">
              <DropdownMenuItem asChild>
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 !text-or" /> Tableau de bord
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="sm:hidden">
                <a href={siteHref} target="_blank" rel="noopener" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 !text-or" /> Voir le site
                </a>
              </DropdownMenuItem>
              {ADMIN_GROUPS.map((g) => (
                <div key={g.key}>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="eyebrow !text-[10px] text-or">{g.title}</DropdownMenuLabel>
                  {ADMIN_SECTIONS.filter((s) => s.group === g.key).map((s) => (
                    <DropdownMenuItem key={s.key} asChild>
                      <Link href={s.href} className={`flex items-center gap-2 ${current?.key === s.key ? "text-or" : ""}`}>
                        <s.icon className="h-4 w-4 !text-or" /> {s.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <a
            href={siteHref}
            target="_blank"
            rel="noopener"
            className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-or sm:flex"
            title={current?.publicHref ? `Ouvrir « ${current.title} » sur le site public` : "Ouvrir le site public"}
          >
            <ExternalLink className="h-4 w-4" />
            Voir le site
          </a>
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  )
}
