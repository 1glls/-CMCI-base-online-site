"use client"

/**
 * Paramètres → « Rythmes et automatismes » :
 *   - durées de défilement des éléments animés du site (lib/timings.ts) ;
 *   - tâches automatiques du serveur (services/scheduler.service.js) :
 *     synchro des réseaux, traduction des nouveaux contenus, newsletter,
 *     contrôle des liens.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, CircleAlert, Clock3, Languages, Link2, Loader2, Mail, Play, RefreshCw, RotateCcw, Save, Share2, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FieldHelp } from "@/components/admin/page-header"
import { askConfirm } from "@/components/admin/confirm-dialog"
import { adminFetch } from "@/lib/admin-api"
import { notify } from "@/lib/admin-notify"
import { TIMINGS, TIMING_MAX, TIMING_MIN, timingSeconds, type TimingKey } from "@/lib/timings"

interface Job {
  key: "social" | "translation" | "newsletter" | "reminders" | "links"
  label: string
  enabled: boolean
  schedule: string
  lastRun: string | null
  lastResult: { ok: boolean; message: string } | null
  nextRun: string | null
  running: boolean
}

const KEYS = Object.keys(TIMINGS) as TimingKey[]

const ago = (iso: string) => {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  return h < 48 ? `il y a ${h} h` : `le ${new Date(iso).toLocaleDateString("fr-BE")}`
}
const until = (iso: string) => {
  const min = Math.round((Date.parse(iso) - Date.now()) / 60000)
  if (min <= 5) return "à la prochaine vérification (≤ 5 min)"
  if (min < 60) return `dans ${min} min`
  const h = Math.round(min / 60)
  return h < 48 ? `dans ${h} h` : `le ${new Date(iso).toLocaleDateString("fr-BE")}`
}

export function TimingSettings() {
  const [settings, setSettings] = useState<Record<string, string> | null>(null)
  const [draft, setDraft] = useState<Record<TimingKey, number> | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [saving, setSaving] = useState(false)
  const [busyJob, setBusyJob] = useState<string | null>(null)
  const [pending, setPending] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const [list, status] = await Promise.all([
        adminFetch<{ key: string; value: string }[]>("/api/settings"),
        adminFetch<Job[]>("/api/settings/jobs"),
      ])
      const map = Object.fromEntries(list.map((s) => [s.key, s.value]))
      setSettings(map)
      setDraft((d) => d ?? (Object.fromEntries(KEYS.map((k) => [k, timingSeconds(k, map[k])])) as Record<TimingKey, number>))
      setJobs(status)
    } catch (e) {
      notify.error("Impossible de charger les rythmes et automatismes", { erreur: e, reessayer: load })
    }
  }, [])

  useEffect(() => { load() }, [load])

  const saved = useMemo(
    () => (settings ? (Object.fromEntries(KEYS.map((k) => [k, timingSeconds(k, settings[k])])) as Record<TimingKey, number>) : null),
    [settings],
  )
  const dirty = !!draft && !!saved && KEYS.some((k) => draft[k] !== saved[k])

  const saveTimings = async () => {
    if (!draft) return
    setSaving(true)
    try {
      await adminFetch("/api/settings", { method: "PUT", json: { values: draft } })
      notify.success("Durées enregistrées", { detail: "Elles s'appliquent sur le site d'ici une minute.", lien: { href: "/" } })
      setDraft(null)
      await load()
    } catch (e) {
      notify.error("Enregistrement impossible", { erreur: e, reessayer: saveTimings })
    } finally {
      setSaving(false)
    }
  }

  /** Réglage d'une tâche : enregistré tout de suite. */
  const saveOne = async (key: string, value: string, message: string) => {
    try {
      await adminFetch("/api/settings", { method: "PUT", json: { values: { [key]: value } } })
      notify.success(message)
      await load()
    } catch (e) {
      notify.error("Modification impossible", { erreur: e })
    }
  }

  const runNow = async (job: Job) => {
    if (job.key === "translation") {
      const ok = await askConfirm({
        title: "Traduire maintenant les contenus manquants ?",
        description: pending !== null ? `Environ ${pending.toLocaleString("fr-BE")} caractères seront envoyés au traducteur (quota DeepL).` : "Les contenus sans traduction anglaise ou néerlandaise seront envoyés au traducteur (quota DeepL).",
        confirmLabel: "Traduire",
        destructive: false,
      })
      if (ok !== true) return
    }
    setBusyJob(job.key)
    try {
      const r = await notify.promise(
        adminFetch<{ ok: boolean; message: string }>(`/api/settings/jobs/${job.key}/run`, { method: "POST" }),
        {
          chargement: `${job.label} en cours…`,
          succes: (res) => (res.ok ? `${job.label} : terminé` : `${job.label} : terminé avec une erreur`),
          detailSucces: (res) => res.message,
          erreur: `${job.label} : échec`,
        },
      )
      if (!r.ok) notify.warning(`${job.label}`, { detail: r.message })
      await load()
    } catch { /* message déjà affiché */ } finally {
      setBusyJob(null)
    }
  }

  const estimate = async () => {
    try {
      const r = await adminFetch<{ characters: number }>("/api/translations/backfill?dryRun=1", { method: "POST" })
      setPending(r.characters)
      if (r.characters === 0) notify.success("Tout est déjà traduit", { detail: "Aucun contenu en attente de traduction." })
      else notify.info(`${r.characters.toLocaleString("fr-BE")} caractères en attente de traduction`)
    } catch (e) {
      notify.error("Estimation impossible", { erreur: e })
    }
  }

  if (!settings || !draft) {
    return <div className="mb-6 h-64 animate-pulse rounded-lg border border-border bg-card" />
  }

  const job = (k: Job["key"]) => jobs.find((j) => j.key === k)

  return (
    <section className="mb-6 rounded-lg border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-display text-3xl"><Timer className="h-6 w-6 text-or" /> Rythmes et automatismes</h2>
      <p className="mt-1 text-sm text-muted-foreground">Tout ce qui défile ou se répète tout seul sur le site, et les tâches que le serveur fait automatiquement.</p>

      {/* ------------------------------ Animations ------------------------------ */}
      <div className="mt-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Animations du site</h3>
          <p className="text-sm text-muted-foreground">Durée d'affichage avant de passer à l'élément suivant (entre {TIMING_MIN} et {TIMING_MAX} secondes).</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setDraft(Object.fromEntries(KEYS.map((k) => [k, TIMINGS[k].def])) as Record<TimingKey, number>)}
            title="Remettre toutes les durées d'origine (à enregistrer ensuite)"
          >
            <RotateCcw className="h-4 w-4" /> Valeurs par défaut
          </Button>
          <Button size="sm" onClick={saveTimings} disabled={!dirty || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer
          </Button>
        </div>
      </div>
      {dirty && <p className="mt-2 text-xs text-or">● Modifications non enregistrées</p>}

      <div className="mt-5 grid gap-x-8 gap-y-6 md:grid-cols-2">
        {KEYS.map((k) => {
          const changed = draft[k] !== saved![k]
          return (
            <div key={k}>
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={k} className="text-sm font-medium">
                  {TIMINGS[k].label}
                  {changed && <span className="ml-2 text-xs text-or" title="Modifié, pas encore enregistré">●</span>}
                </label>
                <span className="font-display text-xl tabular-nums text-or">{draft[k]} s</span>
              </div>
              <input
                id={k}
                type="range"
                min={TIMING_MIN}
                max={TIMING_MAX}
                step={0.5}
                value={draft[k]}
                onChange={(e) => setDraft({ ...draft, [k]: Number(e.target.value) })}
                className="mt-2 w-full accent-[var(--or)]"
              />
              <FieldHelp>{TIMINGS[k].where} Par défaut : {TIMINGS[k].def} s.</FieldHelp>
            </div>
          )
        })}
      </div>

      {/* --------------------------- Tâches automatiques --------------------------- */}
      <div className="mt-12">
        <h3 className="text-lg font-semibold">Tâches automatiques</h3>
        <p className="text-sm text-muted-foreground">Le serveur vérifie toutes les 5 minutes s'il y a quelque chose à faire. Vos choix s'appliquent immédiatement.</p>
      </div>

      <div className="mt-5 divide-y divide-border rounded-lg border border-border">
        {/* Réseaux sociaux */}
        <JobRow icon={Share2} job={job("social")} busy={busyJob === "social"} onRun={() => job("social") && runNow(job("social")!)}>
          <Select
            value={settings.social_sync_hours ?? "6"}
            onValueChange={(v) => saveOne("social_sync_hours", v, v === "0" ? "Synchronisation automatique désactivée" : `Synchronisation toutes les ${v} h`)}
          >
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Désactivée (manuelle)</SelectItem>
              {["1", "3", "6", "12", "24"].map((h) => <SelectItem key={h} value={h}>Toutes les {h} h</SelectItem>)}
            </SelectContent>
          </Select>
          <FieldHelp>Récupère les nouvelles publications YouTube, Facebook, Instagram et TikTok (page <Link href="/admin/social-media" className="text-or underline">Réseaux sociaux</Link>).</FieldHelp>
        </JobRow>

        {/* Traductions */}
        <JobRow icon={Languages} job={job("translation")} busy={busyJob === "translation"} onRun={() => job("translation") && runNow(job("translation")!)} runLabel="Traduire maintenant">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { v: "immediate", t: "Immédiate", d: "Dès qu'un contenu est enregistré (comme avant)." },
              { v: "scheduled", t: "Regroupée", d: "Le serveur traduit tout ce qui manque à intervalle régulier." },
              { v: "manual", t: "Manuelle", d: "Seulement quand vous cliquez sur « Traduire maintenant »." },
            ].map((o) => {
              const active = (settings.translation_mode ?? "immediate") === o.v
              return (
                <button
                  key={o.v} type="button"
                  onClick={() => !active && saveOne("translation_mode", o.v, `Traduction : mode « ${o.t} »`)}
                  className={`rounded-md border p-3 text-left text-sm transition-colors ${active ? "border-or bg-or/10" : "border-border hover:border-or/50"}`}
                  aria-pressed={active}
                >
                  <span className="font-medium">{o.t}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{o.d}</span>
                </button>
              )
            })}
          </div>
          {settings.translation_mode === "scheduled" && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              Toutes les
              <Select value={settings.translation_interval_hours ?? "24"} onValueChange={(v) => saveOne("translation_interval_hours", v, `Traduction regroupée toutes les ${v} h`)}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>{["1", "6", "12", "24"].map((h) => <SelectItem key={h} value={h}>{h} h</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <Button size="sm" variant="ghost" onClick={estimate}><RefreshCw className="h-4 w-4" /> Estimer ce qui reste à traduire</Button>
            {pending !== null && <span className="text-muted-foreground">{pending === 0 ? "Tout est traduit." : `${pending.toLocaleString("fr-BE")} caractères en attente`}</span>}
          </div>
          <FieldHelp>Versions anglaise et néerlandaise du contenu. Comptes de traduction et quota : page <Link href="/admin/translations" className="text-or underline">Traductions</Link>.</FieldHelp>
        </JobRow>

        {/* Newsletter */}
        <JobRow icon={Mail} job={job("newsletter")} busy={false}>
          <p className="text-sm">
            {job("newsletter")?.enabled ? "Activée" : "Désactivée"} — à régler sur la page{" "}
            <Link href="/admin/newsletter" className="text-or underline">Newsletter</Link> (fréquence, jour, heure).
          </p>
        </JobRow>
        <JobRow icon={Clock3} job={job("reminders")} busy={false}>
          <label className="flex items-center gap-2 text-sm">
            <Switch
              checked={(settings.newsletter_reminders ?? "true") === "true"}
              onCheckedChange={(v) => saveOne("newsletter_reminders", String(v), v ? "Rappels d'événements activés" : "Rappels d'événements désactivés")}
            />
            Envoyer un rappel aux abonnés la veille et le jour d'un événement
          </label>
          <FieldHelp>Envoyé chaque jour à l'heure choisie sur la page Newsletter, seulement s'il y a un événement ce jour-là ou le lendemain.</FieldHelp>
        </JobRow>

        {/* Contrôle des liens */}
        <JobRow icon={Link2} job={job("links")} busy={busyJob === "links"} onRun={() => job("links") && runNow(job("links")!)} runLabel="Contrôler maintenant">
          <LinksCheckSettings settings={settings} saveOne={saveOne} />
          <FieldHelp>Teste les liens saisis dans l'admin, les images et fichiers, et toutes les pages du site. Détail, liens cassés et email d'alerte : page <Link href="/admin/links" className="text-or underline">Contrôle des liens</Link>.</FieldHelp>
        </JobRow>
      </div>
    </section>
  )
}

/** Choix Manuel / Automatique + fréquence (réutilisé par la page Contrôle des liens). */
export function LinksCheckSettings({ settings, saveOne }: {
  settings: Record<string, string>
  saveOne: (key: string, value: string, message: string) => void
}) {
  const mode = settings.links_check_mode ?? "auto"
  const FREQ: Record<string, string> = { "24": "Tous les jours", "72": "Tous les 3 jours", "168": "Chaque semaine", "720": "Chaque mois" }
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { v: "auto", t: "Automatique", d: "Le serveur contrôle tout seul et vous écrit si un lien casse." },
          { v: "manual", t: "Manuel", d: "Seulement quand vous cliquez sur « Contrôler maintenant »." },
        ].map((o) => {
          const active = mode === o.v
          return (
            <button
              key={o.v} type="button"
              onClick={() => !active && saveOne("links_check_mode", o.v, `Contrôle des liens : mode « ${o.t} »`)}
              className={`rounded-md border p-3 text-left text-sm transition-colors ${active ? "border-or bg-or/10" : "border-border hover:border-or/50"}`}
              aria-pressed={active}
            >
              <span className="font-medium">{o.t}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{o.d}</span>
            </button>
          )
        })}
      </div>
      {mode === "auto" && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          Fréquence
          <Select value={settings.links_check_interval_hours ?? "168"} onValueChange={(v) => saveOne("links_check_interval_hours", v, `Contrôle des liens : ${FREQ[v]?.toLowerCase()}`)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(FREQ).map(([h, t]) => <SelectItem key={h} value={h}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
    </>
  )
}

function JobRow({ icon: Icon, job, busy, onRun, runLabel = "Lancer maintenant", children }: {
  icon: React.ComponentType<{ className?: string }>
  job?: Job
  busy: boolean
  onRun?: () => void
  runLabel?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-4 p-4 lg:grid-cols-[1fr_17rem]">
      <div>
        <p className="flex items-center gap-2 font-medium"><Icon className="h-4 w-4 text-or" />{job?.label ?? "…"}</p>
        <div className="mt-3">{children}</div>
      </div>
      <div className="space-y-1.5 text-xs text-muted-foreground lg:border-l lg:border-border lg:pl-4">
        <p className="text-foreground/80">{job?.schedule}</p>
        {job?.lastRun ? (
          <p className="flex items-start gap-1.5">
            {job.lastResult?.ok === false
              ? <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rouge-texte)]" />
              : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--succes)]" />}
            <span>Dernier passage {ago(job.lastRun)}{job.lastResult?.message ? ` : ${job.lastResult.message}` : ""}</span>
          </p>
        ) : (
          <p>Jamais lancé pour l'instant.</p>
        )}
        {job?.nextRun && <p>Prochain passage : {until(job.nextRun)}</p>}
        {onRun && (
          <Button size="sm" variant="outline" className="mt-2" onClick={onRun} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} {runLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
