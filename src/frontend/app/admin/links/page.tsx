"use client"

/**
 * Contrôle des liens : catalogue de tout ce qui peut renvoyer une erreur
 * (liens saisis dans l'admin, images et fichiers, pages du sitemap) avec le
 * résultat du dernier contrôle. Le contrôle tourne tout seul (tâche « links »
 * du planificateur, backend/services/scheduler.service.js) ou à la demande.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  CheckCircle2, CircleAlert, ExternalLink, EyeOff, FileImage, Globe, Link2, Loader2, Play, RefreshCw, Save, Search, TriangleAlert, Undo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminPageHeader, FieldHelp } from "@/components/admin/page-header"
import { LinksCheckSettings } from "@/components/admin/timing-settings"
import { adminFetch } from "@/lib/admin-api"
import { notify } from "@/lib/admin-notify"
import { toast } from "sonner"

type State = "broken" | "warning" | "ok" | "pending"
interface Row {
  id: string; url: string; kind: "external" | "file" | "page"
  sourceModel: string; field: string; label: string | null; adminHref: string | null
  status: number | null; state: State; error: string | null
  firstFailedAt: string | null; lastCheckedAt: string | null; ignored: boolean
}
interface Job { label: string; enabled: boolean; schedule: string; lastRun: string | null; lastResult: { ok: boolean; message: string } | null; nextRun: string | null; running: boolean }
interface Summary { total: number; ok: number; warning: number; broken: number; pending: number; ignored: number; job: Job | null }
interface Config { mode: string; intervalHours: string; alertEmail: string }

type Tab = "broken" | "warning" | "ok" | "ignored"
const TABS: { key: Tab; label: string; icon: typeof Link2; hint: string }[] = [
  { key: "broken", label: "Cassés", icon: CircleAlert, hint: "Introuvables (404), domaine disparu, erreur du serveur : à corriger." },
  { key: "warning", label: "À vérifier", icon: TriangleAlert, hint: "Le site distant a refusé le robot ou n'a pas répondu à temps. Ouvrez le lien dans votre navigateur : s'il marche, cliquez sur « Ignorer »." },
  { key: "ok", label: "OK", icon: CheckCircle2, hint: "Liens qui répondaient correctement au dernier contrôle." },
  { key: "ignored", label: "Ignorés", icon: EyeOff, hint: "Liens que vous avez choisi de ne plus contrôler." },
]
const KINDS: { key: "" | Row["kind"]; label: string; icon: typeof Link2 }[] = [
  { key: "", label: "Tout", icon: Link2 },
  { key: "external", label: "Liens externes", icon: ExternalLink },
  { key: "file", label: "Images et fichiers", icon: FileImage },
  { key: "page", label: "Pages du site", icon: Globe },
]
const PAGE = 100

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString("fr-BE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—")
const tabOf = (r: Row): Tab | "pending" => (r.ignored ? "ignored" : r.state === "pending" ? "pending" : r.state)

export default function LinksPage() {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [config, setConfig] = useState<Config | null>(null)
  const [email, setEmail] = useState("")
  const [tab, setTab] = useState<Tab>("broken")
  const [kind, setKind] = useState<"" | Row["kind"]>("")
  const [query, setQuery] = useState("")
  const [shown, setShown] = useState(PAGE)
  const [running, setRunning] = useState(false)
  const [busy, setBusy] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    try {
      const [list, sum, cfg] = await Promise.all([
        adminFetch<Row[]>("/api/links"),
        adminFetch<Summary>("/api/links/summary"),
        adminFetch<Config>("/api/links/config"),
      ])
      setRows(list)
      setSummary(sum)
      setConfig(cfg)
      setEmail((e) => (e === "" ? cfg.alertEmail : e))
    } catch (e) {
      notify.error("Impossible de charger le contrôle des liens", { erreur: e, reessayer: load })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { broken: 0, warning: 0, ok: 0, ignored: 0, pending: 0 }
    for (const r of rows ?? []) c[tabOf(r)]++
    return c
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (rows ?? []).filter((r) => tabOf(r) === tab && (!kind || r.kind === kind)
      && (!q || r.url.toLowerCase().includes(q) || (r.label ?? "").toLowerCase().includes(q)))
  }, [rows, tab, kind, query])

  /**
   * Le contrôle complet tourne en arrière-plan sur le serveur (il dure plus
   * longtemps que ce qu'un proxy accepte pour une requête). On le lance, puis
   * on interroge l'état toutes les 3 s jusqu'à ce qu'il soit terminé.
   */
  const polling = useRef(false)
  const waitForEnd = useCallback(async () => {
    if (polling.current) return
    polling.current = true
    setRunning(true)
    const id = toast.loading("Contrôle de tous les liens en cours… (une à deux minutes)", { description: "Vous pouvez quitter la page : il continue sur le serveur." })
    let failures = 0
    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, 3000))
        try {
          const s = await adminFetch<Summary>("/api/links/summary")
          failures = 0
          setSummary(s)
          if (!s.job?.running) {
            const msg = s.job?.lastResult?.message
            if (s.job?.lastResult?.ok === false) toast.error("Le contrôle a échoué", { id, description: msg, duration: Infinity })
            else toast.success("Contrôle terminé", { id, description: msg, duration: 6000 })
            break
          }
        } catch {
          // Coupure passagère : on réessaie quelques fois avant d'abandonner.
          if (++failures >= 5) {
            toast.error("Suivi du contrôle interrompu", { id, description: "Le serveur ne répond plus. Le contrôle continue peut-être : rechargez la page dans une minute.", duration: Infinity })
            break
          }
        }
      }
      await load()
    } finally {
      polling.current = false
      setRunning(false)
    }
  }, [load])

  // Contrôle déjà en cours à l'ouverture de la page (lancé par le planificateur ou un autre onglet)
  useEffect(() => { if (summary?.job?.running) waitForEnd() }, [summary?.job?.running, waitForEnd])

  const runAll = async () => {
    try {
      const r = await adminFetch<{ ok: boolean; started: boolean; message: string }>("/api/links/run", { method: "POST" })
      if (!r.started) notify.info("Un contrôle est déjà en cours", { detail: "Suivi de son avancement…" })
      waitForEnd()
    } catch (e) {
      notify.error("Impossible de lancer le contrôle", { erreur: e, reessayer: runAll })
    }
  }

  const recheck = async (ids: string[], label: string) => {
    if (ids.length === 0) return
    setBusy((b) => new Set([...b, ...ids]))
    try {
      const r = await notify.promise(
        adminFetch<{ rows: Row[] }>("/api/links/recheck", { method: "POST", json: { ids } }),
        {
          chargement: `${label} en cours…`,
          succes: (res) => {
            const still = res.rows.filter((x) => x.state === "broken").length
            return still === 0 ? "Tout répond correctement" : `${still} lien${still > 1 ? "s" : ""} toujours cassé${still > 1 ? "s" : ""}`
          },
          erreur: `${label} : échec`,
        },
      )
      const byId = new Map(r.rows.map((x) => [x.id, x]))
      setRows((list) => list?.map((x) => byId.get(x.id) ?? x) ?? null)
      adminFetch<Summary>("/api/links/summary").then(setSummary).catch(() => {})
    } catch { /* message déjà affiché */ } finally {
      setBusy((b) => { const n = new Set(b); ids.forEach((id) => n.delete(id)); return n })
    }
  }

  const setIgnored = async (row: Row, ignored: boolean) => {
    try {
      const updated = await adminFetch<Row>(`/api/links/${row.id}`, { method: "PATCH", json: { ignored } })
      setRows((list) => list?.map((x) => (x.id === row.id ? updated : x)) ?? null)
      notify.success(ignored ? "Lien ignoré" : "Lien de nouveau contrôlé", { detail: ignored ? "Il ne sera plus testé ni signalé." : undefined })
    } catch (e) {
      notify.error("Modification impossible", { erreur: e })
    }
  }

  const saveOne = async (key: string, value: string, message: string) => {
    try {
      await adminFetch("/api/settings", { method: "PUT", json: { values: { [key]: value } } })
      notify.success(message)
      await load()
    } catch (e) {
      notify.error("Modification impossible", { erreur: e })
    }
  }

  const job = summary?.job
  const lastRunLabel = job?.lastRun ? date(job.lastRun) : "jamais"

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminPageHeader
        section="links"
        actions={
          <Button onClick={runAll} disabled={running || !!job?.running}>
            {running || job?.running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Contrôler maintenant
          </Button>
        }
      />

      {/* Résumé */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TABS.map((t) => (
          <button
            key={t.key} type="button" onClick={() => { setTab(t.key); setShown(PAGE) }}
            className={`rounded-lg border bg-card p-4 text-left transition-colors ${tab === t.key ? "border-or" : "border-border hover:border-or/50"}`}
          >
            <span className="flex items-center gap-2 text-sm text-muted-foreground"><t.icon className="h-4 w-4 text-or" />{t.label}</span>
            <span className={`mt-1 block font-display text-4xl leading-none ${t.key === "broken" && counts.broken > 0 ? "text-[var(--rouge-texte)]" : "text-foreground"}`}>
              {rows ? counts[t.key] : "…"}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Dernier contrôle : {lastRunLabel}
        {job?.lastResult?.message ? ` — ${job.lastResult.message}` : ""}
        {job?.enabled && job.nextRun ? ` · prochain : ${date(job.nextRun)}` : ""}
        {counts.pending > 0 ? ` · ${counts.pending} lien(s) pas encore testé(s)` : ""}
      </p>

      {/* Réglages */}
      <section className="mt-8 rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Quand contrôler ?</h2>
        {config ? (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <div>
              <LinksCheckSettings
                settings={{ links_check_mode: config.mode, links_check_interval_hours: config.intervalHours }}
                saveOne={saveOne}
              />
              <FieldHelp>{job?.schedule}</FieldHelp>
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); saveOne("links_alert_email", email.trim(), email.trim() ? "Adresse d'alerte enregistrée" : "Alerte envoyée aux administrateurs") }}
            >
              <label htmlFor="alert-email" className="text-sm font-medium">Email d'alerte</label>
              <div className="mt-2 flex gap-2">
                <Input id="alert-email" type="text" inputMode="email" placeholder="Vide = tous les administrateurs" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Button type="submit" variant="outline" disabled={email.trim() === config.alertEmail}><Save className="h-4 w-4" /> Enregistrer</Button>
              </div>
              <FieldHelp>Un email récapitulatif est envoyé quand un contrôle trouve de <strong>nouveaux</strong> liens cassés. Plusieurs adresses : séparez-les par une virgule.</FieldHelp>
            </form>
          </div>
        ) : (
          <div className="mt-4 h-24 animate-pulse rounded bg-muted" />
        )}
      </section>

      {/* Liste */}
      <section className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          {KINDS.map((k) => (
            <button
              key={k.key} type="button" onClick={() => { setKind(k.key); setShown(PAGE) }}
              aria-pressed={kind === k.key}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${kind === k.key ? "border-or bg-or/10 text-foreground" : "border-border text-muted-foreground hover:border-or/50"}`}
            >
              <k.icon className="h-3.5 w-3.5" />{k.label}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Rechercher un titre ou une URL" value={query} onChange={(e) => { setQuery(e.target.value); setShown(PAGE) }} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{TABS.find((t) => t.key === tab)?.hint}</p>
          {(tab === "broken" || tab === "warning") && filtered.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => recheck(filtered.slice(0, 200).map((r) => r.id), "Nouveau test de la liste")}>
              <RefreshCw className="h-4 w-4" /> Retester {filtered.length > 200 ? "les 200 premiers" : `ces ${filtered.length}`} liens
            </Button>
          )}
        </div>

        {!rows ? (
          <div className="mt-4 h-64 animate-pulse rounded-lg border border-border bg-card" />
        ) : filtered.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {rows.length === 0
              ? <>Aucun contrôle n'a encore été fait. Cliquez sur « Contrôler maintenant ».</>
              : tab === "broken" ? <><CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-[var(--succes)]" />Aucun lien cassé{kind || query ? " pour ce filtre" : ""}.</> : "Rien ici."}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {filtered.slice(0, shown).map((r) => {
              const isBusy = busy.has(r.id)
              return (
                <li key={r.id} className="grid gap-3 p-4 text-sm lg:grid-cols-[1fr_auto]">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {r.label ?? r.sourceModel}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">{r.field}</span>
                    </p>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-xs text-or hover:underline" title={r.url}>{r.url}</a>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.state !== "pending" && (
                        <span className={r.state === "broken" ? "text-[var(--rouge-texte)]" : r.state === "warning" ? "text-amber-500" : "text-[var(--succes)]"}>
                          {r.status ?? "—"}{r.error ? ` · ${r.error}` : ""}
                        </span>
                      )}
                      {r.firstFailedAt && r.state !== "ok" && <> · en erreur depuis le {date(r.firstFailedAt)}</>}
                      {r.lastCheckedAt && <> · testé le {date(r.lastCheckedAt)}</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {r.adminHref && (
                      <Button asChild size="sm" variant="outline"><Link href={r.adminHref}>Corriger</Link></Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => recheck([r.id], "Nouveau test")} disabled={isBusy}>
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Retester
                    </Button>
                    {r.ignored ? (
                      <Button size="sm" variant="ghost" onClick={() => setIgnored(r, false)}><Undo2 className="h-4 w-4" /> Reprendre</Button>
                    ) : r.state !== "ok" && (
                      <Button size="sm" variant="ghost" onClick={() => setIgnored(r, true)}><EyeOff className="h-4 w-4" /> Ignorer</Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {filtered.length > shown && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={() => setShown((n) => n + PAGE)}>Afficher plus ({filtered.length - shown})</Button>
          </div>
        )}
      </section>
    </main>
  )
}
