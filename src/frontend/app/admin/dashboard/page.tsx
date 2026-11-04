"use client"

/**
 * Tableau de bord : une tuile par section (lib/admin-sections.ts) avec le nombre
 * d'éléments visibles / masqués, et un bloc « À traiter » qui signale ce qui
 * demande l'attention de l'administrateur.
 */
import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CalendarClock, CalendarX, ChevronDown, ChevronRight, Eye, EyeOff, Info, Link2Off, RefreshCw, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { adminFetch, adminList, getAdmin } from "@/lib/admin-api"
import { ADMIN_GROUPS, ADMIN_SECTIONS, type AdminGroup } from "@/lib/admin-sections"
import { parseEventDate } from "@/lib/event-date"

type Count = { total: number; hidden: number; label?: string }
type Todo = { key: string; level: "warning" | "info"; icon: typeof Info; text: string; href: string; action: string }

const visible = (s?: string | null) => (s ?? "published") === "published"

export default function AdminDashboard() {
  const [name, setName] = useState("")
  const [counts, setCounts] = useState<Record<string, Count | null>>({})
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState<string[]>([])
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(ADMIN_GROUPS.map((g) => g.key)))

  useEffect(() => {
    setName(getAdmin()?.name ?? "")
    try {
      const saved = localStorage.getItem("adminDashGroups")
      if (saved) setOpenGroups(new Set(JSON.parse(saved)))
    } catch { /* préférence illisible : tout reste ouvert */ }
  }, [])

  const toggleGroup = (key: AdminGroup) => {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      try { localStorage.setItem("adminDashGroups", JSON.stringify([...next])) } catch { /* ignore */ }
      return next
    })
  }

  const load = useCallback(async () => {
    setLoading(true)
    const errors: string[] = []
    const result: Record<string, Count | null> = {}
    const lists: Record<string, any[]> = {}

    // Sections dont les éléments ont un statut visible / masqué
    await Promise.all(
      ADMIN_SECTIONS.filter((s) => s.listUrl).map(async (s) => {
        try {
          const list = await adminList(s.listUrl!)
          lists[s.key] = list
          result[s.key] = { total: list.length, hidden: list.filter((x) => !visible(x.status)).length }
        } catch {
          errors.push(s.title)
          result[s.key] = null
        }
      }),
    )

    // Compteurs particuliers
    const extra: [string, () => Promise<Count>][] = [
      ["books", async () => {
        const books = await adminList<{ hidden: boolean }>("/api/books/all")
        return { total: books.length, hidden: books.filter((b) => b.hidden).length }
      }],
      ["categories", async () => ({ total: (await adminList("/api/categories")).length, hidden: 0, label: "catégories" })],
      ["newsletter", async () => {
        const s = await adminFetch<{ active?: number }>("/api/newsletter/stats")
        return { total: s?.active ?? 0, hidden: 0, label: "abonnés actifs" }
      }],
      ["social", async () => {
        const pending = await adminList("/api/social-media/all?status=pending")
        return { total: pending.length, hidden: 0, label: "en attente" }
      }],
    ]
    await Promise.all(
      extra.map(async ([key, fn]) => {
        try { result[key] = await fn() } catch {
          errors.push(ADMIN_SECTIONS.find((s) => s.key === key)?.title ?? key)
          result[key] = null
        }
      }),
    )

    // Bloc « À traiter »
    const t: Todo[] = []
    const pending = result.social?.total ?? 0
    if (pending > 0) {
      t.push({ key: "social", level: "warning", icon: Share2, text: `${pending} publication${pending > 1 ? "s" : ""} des réseaux sociaux en attente de tri.`, href: "/admin/social-media", action: "Trier" })
    }
    const events = lists.events ?? []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const pastVisible = events.filter((e) => visible(e.status) && (parseEventDate(e.date)?.getTime() ?? Infinity) < today.getTime())
    if (pastVisible.length) {
      t.push({ key: "past", level: "info", icon: CalendarClock, text: `${pastVisible.length} événement${pastVisible.length > 1 ? "s" : ""} passé${pastVisible.length > 1 ? "s" : ""} encore visible${pastVisible.length > 1 ? "s" : ""} sur la frise de l'Agenda. Masquez-les si vous ne voulez plus les montrer.`, href: "/admin/events", action: "Voir" })
    }
    const undated = events.filter((e) => visible(e.status) && !parseEventDate(e.date))
    if (undated.length) {
      t.push({ key: "undated", level: "warning", icon: CalendarX, text: `${undated.length} événement${undated.length > 1 ? "s" : ""} dont la date n'est pas reconnue (ex. « ${undated[0].date} ») : ${undated.length > 1 ? "ils sont affichés" : "il est affiché"} comme rendez-vous réguliers, hors de la frise.`, href: "/admin/events", action: "Corriger" })
    }
    const hiddenEventIds = new Set(events.filter((e) => !visible(e.status)).map((e) => e.id))
    const orphanSlides = (lists.hero ?? []).filter((s) => visible(s.status) && s.eventId && hiddenEventIds.has(s.eventId))
    if (orphanSlides.length) {
      t.push({ key: "hero", level: "info", icon: Link2Off, text: `${orphanSlides.length} diapositive${orphanSlides.length > 1 ? "s" : ""} du haut de l'accueil ${orphanSlides.length > 1 ? "sont masquées" : "est masquée"} automatiquement, car l'événement lié est masqué.`, href: "/admin/hero", action: "Voir" })
    }

    setCounts(result)
    setTodos(t)
    setFailed(errors)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <span className="eyebrow flex items-center gap-3 text-or">
        <span className="h-px w-10 bg-or" aria-hidden />
        Tableau de bord
      </span>
      <h1 className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
        Bonjour{name ? ` ${name}` : ""}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Choisissez une section à gérer. Chaque page indique où son contenu apparaît sur le site.
        Un élément <strong className="text-foreground">masqué</strong> n'est plus affiché aux visiteurs mais n'est pas supprimé.
      </p>

      {failed.length > 0 && !loading && (
        <div role="alert" className="mt-6 flex flex-col gap-3 rounded-lg border border-[var(--rouge)]/50 bg-[var(--rouge)]/10 px-4 py-3 text-sm sm:flex-row sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[var(--rouge-texte)]" />
          <span className="flex-1">Certains chiffres n'ont pas pu être chargés ({failed.join(", ")}). Les pages restent accessibles.</span>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Réessayer</Button>
        </div>
      )}

      {todos.length > 0 && (
        <section className="mt-8" aria-labelledby="todo-title">
          <h2 id="todo-title" className="eyebrow mb-3 text-or">À traiter</h2>
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {todos.map((t) => (
              <li key={t.key} className="flex items-start gap-3 px-4 py-3 text-sm">
                <t.icon className={`mt-0.5 h-4 w-4 shrink-0 ${t.level === "warning" ? "text-amber-500" : "text-or"}`} />
                <span className="flex-1 leading-relaxed">{t.text}</span>
                <Link href={t.href} className="flex shrink-0 items-center gap-0.5 text-or hover:underline">
                  {t.action} <ChevronRight className="h-4 w-4" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10 space-y-6">
        {ADMIN_GROUPS.map((g) => {
          const items = ADMIN_SECTIONS.filter((s) => s.group === g.key)
          const isOpen = openGroups.has(g.key)
          return (
            <section key={g.key} className="rounded-xl border border-border bg-card/40">
              <button
                type="button"
                onClick={() => toggleGroup(g.key)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span>
                  <span className="font-display text-2xl text-foreground">{g.title}</span>
                  <span className="ml-3 text-xs text-muted-foreground">{g.hint}</span>
                </span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((s) => {
                    const c = counts[s.key]
                    const alert = s.key === "social" && (c?.total ?? 0) > 0
                    return (
                      <Link
                        key={s.key}
                        href={s.href}
                        className="group flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-or/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <s.icon className="h-7 w-7 text-or" />
                          <TileCount count={c} loading={loading} alert={alert} hasStatus={!!s.listUrl || s.key === "books"} />
                        </div>
                        <h3 className="mt-3 text-base font-semibold text-foreground group-hover:text-or">{s.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                      </Link>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </main>
  )
}

function TileCount({ count, loading, alert, hasStatus }: { count: Count | null | undefined; loading: boolean; alert: boolean; hasStatus: boolean }) {
  if (loading) return <span className="h-6 w-12 animate-pulse rounded bg-muted" aria-label="Chargement" />
  if (count === undefined) return null
  if (count === null) return <span className="text-xs text-muted-foreground" title="Chiffre indisponible">—</span>
  if (!hasStatus) {
    return (
      <span className="text-right">
        <span className={`block font-display text-3xl leading-none ${alert ? "text-[var(--rouge-texte)]" : "text-foreground"}`}>{count.total}</span>
        {count.label && <span className="text-xs text-muted-foreground">{count.label}</span>}
      </span>
    )
  }
  const shown = count.total - count.hidden
  return (
    <span className="text-right">
      <span className="flex items-center justify-end gap-1.5 font-display text-3xl leading-none text-foreground" title={`${shown} visible(s) sur le site`}>
        <Eye className="h-4 w-4 text-or" />{shown}
      </span>
      {count.hidden > 0 && (
        <span className="mt-1 flex items-center justify-end gap-1 text-xs text-muted-foreground" title={`${count.hidden} masqué(s), non supprimé(s)`}>
          <EyeOff className="h-3 w-3" />{count.hidden} masqué{count.hidden > 1 ? "s" : ""}
        </span>
      )}
    </span>
  )
}
