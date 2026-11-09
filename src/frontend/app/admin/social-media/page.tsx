"use client"

/**
 * Réseaux sociaux : comptes reliés (YouTube, Facebook, Instagram, TikTok) et
 * publications récupérées automatiquement, à valider avant leur affichage
 * dans « À la une » de l'accueil (rangée « Sur nos réseaux »).
 */
import { useCallback, useEffect, useState } from "react"
import {
  CheckCircle2, CircleAlert, CircleDashed, ExternalLink, Eye, EyeOff, Facebook, Instagram, Link2, Loader2,
  Play, RefreshCw, Save, Settings2, ThumbsDown, ThumbsUp, Trash2, Undo2, Youtube,
} from "lucide-react"
import { FaTiktok } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { AdminPageHeader, FieldHelp } from "@/components/admin/page-header"
import { askConfirm } from "@/components/admin/confirm-dialog"
import { API_URL, getImageUrl } from "@/lib/api"
import { adminFetch, adminList } from "@/lib/admin-api"
import { notify } from "@/lib/admin-notify"

type Platform = "youtube" | "facebook" | "instagram" | "tiktok"

interface AccountField {
  key: string
  label: string
  secret: boolean
  required: boolean
  source: "admin" | "env" | "facebook" | null
  value: string | null
  masked: string | null
}

interface Account {
  platform: Platform
  name: string
  enabled: boolean
  autoApprove: boolean
  accountName: string | null
  lastSyncAt: string | null
  lastCount: number | null
  lastError: string | null
  configured: boolean
  fields: AccountField[]
}

interface Post {
  id: string
  platform: Platform
  title: string | null
  content: string | null
  mediaUrl: string | null
  thumbnailUrl: string | null
  localThumbnail: string | null
  author: string | null
  publishedAt: string | null
  isVideo: boolean
  status: "pending" | "approved" | "rejected" | "hidden"
}

interface SyncResult { platform: Platform; ok: boolean; skipped?: boolean; nouveaux: number; total: number; error?: string; code?: string }

const ICONS: Record<Platform, React.ComponentType<{ className?: string }>> = {
  youtube: Youtube, facebook: Facebook, instagram: Instagram, tiktok: FaTiktok,
}
const NAMES: Record<Platform, string> = { youtube: "YouTube", facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" }

/** Guides pas à pas affichés dans le formulaire de chaque réseau. */
const GUIDES: Record<Platform, React.ReactNode> = {
  youtube: (
    <ol className="list-decimal space-y-1 pl-4">
      <li>Ouvrez <a className="text-or underline" href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener">Google Cloud Console → YouTube Data API v3</a> et cliquez sur « Activer ».</li>
      <li>Menu « Identifiants » → « Créer des identifiants » → « Clé API ». Copiez la clé (elle commence par AIza…).</li>
      <li>L'ID de la chaîne se trouve sur <a className="text-or underline" href="https://www.youtube.com/account_advanced" target="_blank" rel="noopener">youtube.com/account_advanced</a> (il commence par UC…).</li>
      <li>Ces deux informations n'expirent jamais. Gratuit (quota largement suffisant).</li>
    </ol>
  ),
  facebook: (
    <ol className="list-decimal space-y-1 pl-4">
      <li>Créez une app de type « Entreprise » sur <a className="text-or underline" href="https://developers.facebook.com/apps" target="_blank" rel="noopener">developers.facebook.com</a>.</li>
      <li>Dans l'<a className="text-or underline" href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener">explorateur de l'API Graph</a>, choisissez votre app, demandez les autorisations <code>pages_show_list</code>, <code>pages_read_engagement</code>, <code>instagram_basic</code>, puis « Generate Access Token ».</li>
      <li>Transformez ce jeton en jeton longue durée (<a className="text-or underline" href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener">outil de débogage</a> → « Extend Access Token »), puis appelez <code>me/accounts</code> avec lui : le <strong>jeton de la Page</strong> obtenu n'expire pas.</li>
      <li>L'ID de la Page figure dans la même réponse (<code>id</code>), ou dans « À propos » de la Page.</li>
    </ol>
  ),
  instagram: (
    <ol className="list-decimal space-y-1 pl-4">
      <li>Le compte Instagram doit être <strong>professionnel</strong> (Entreprise ou Créateur) et <strong>relié à la Page Facebook</strong> (Paramètres de la Page → Comptes liés).</li>
      <li>Dans l'explorateur de l'API Graph, avec le jeton de Page, appelez <code>{"{id-de-la-page}"}?fields=instagram_business_account</code> : le nombre renvoyé est l'ID à saisir ici.</li>
      <li>Le jeton peut rester vide : celui de Facebook est réutilisé.</li>
    </ol>
  ),
  tiktok: (
    <ol className="list-decimal space-y-1 pl-4">
      <li>Créez une app sur <a className="text-or underline" href="https://developers.tiktok.com/apps" target="_blank" rel="noopener">developers.tiktok.com</a>, ajoutez les produits « Login Kit » et « Display API » (autorisations <code>user.info.basic</code> et <code>video.list</code>).</li>
      <li>Dans « Login Kit », déclarez l'adresse de retour : <code className="break-all">{`${API_URL}/api/social-media/tiktok/callback`}</code></li>
      <li>Soumettez l'app : TikTok doit la <strong>valider</strong> (quelques jours).</li>
      <li>Saisissez ici la client key et le client secret, enregistrez, puis cliquez sur « Connecter TikTok » et acceptez avec le compte de l'église. Le reste est automatique (le jeton est renouvelé tout seul).</li>
    </ol>
  ),
}

const STATUS_TABS: { key: Post["status"]; label: string; hint: string }[] = [
  { key: "pending", label: "En attente", hint: "Récupérées, pas encore visibles sur le site" },
  { key: "approved", label: "Publiées", hint: "Visibles dans « À la une » de l'accueil" },
  { key: "hidden", label: "Masquées", hint: "Retirées du site, conservées ici" },
  { key: "rejected", label: "Refusées", hint: "Jamais affichées (ne reviendront pas à la synchro)" },
]

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-BE", { day: "numeric", month: "short", year: "numeric" }) : "")
const fmtAgo = (d: string) => {
  const min = Math.round((Date.now() - new Date(d).getTime()) / 60000)
  if (min < 1) return "à l'instant"
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 48) return `il y a ${h} h`
  return `le ${fmtDate(d)}`
}

export default function SocialMediaPage() {
  const [accounts, setAccounts] = useState<Account[] | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<Post["status"]>("pending")
  const [net, setNet] = useState<"all" | Platform>("all")
  const [syncing, setSyncing] = useState(false)
  const [openForm, setOpenForm] = useState<Platform | null>(null)
  // Réglages liés : nombre de publications dans le haut de l'accueil, rythme de synchro
  const [syncHours, setSyncHours] = useState("6")

  const load = useCallback(async () => {
    try {
      const [acc, list] = await Promise.all([
        adminFetch<Account[]>("/api/social-media/accounts"),
        adminList<Post>("/api/social-media/all"),
      ])
      setAccounts(acc)
      setPosts(list)
      setLoadError(null)
      const settings = await adminFetch<{ key: string; value: string }[]>("/api/settings")
      const map = Object.fromEntries(settings.map((x) => [x.key, x.value]))
      setSyncHours(map.social_sync_hours ?? "6")
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Chargement impossible")
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Retour de la connexion TikTok (?tiktok=ok | erreur&message=…)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const r = q.get("tiktok")
    if (!r) return
    if (r === "ok") notify.success("TikTok connecté", { detail: "Le compte est relié : ses vidéos arriveront à la prochaine synchronisation." })
    else notify.error("Connexion TikTok impossible", { detail: q.get("message") || undefined })
    window.history.replaceState(null, "", "/admin/social-media")
  }, [])

  const syncNow = async () => {
    setSyncing(true)
    try {
      const { results } = await notify.promise(
        adminFetch<{ results: SyncResult[] }>("/api/social-media/sync-all", { method: "POST" }),
        {
          chargement: "Synchronisation des réseaux en cours…",
          erreur: "Synchronisation impossible",
          succes: ({ results }) => {
            const n = results.reduce((s, r) => s + (r.nouveaux || 0), 0)
            const failed = results.filter((r) => !r.ok && r.code !== "not_configured").length
            return failed ? `Synchronisation terminée avec ${failed} erreur${failed > 1 ? "s" : ""}` : `Synchronisation terminée : ${n} nouvelle${n > 1 ? "s" : ""} publication${n > 1 ? "s" : ""}`
          },
          detailSucces: ({ results }) =>
            results.map((r) => `${NAMES[r.platform]} : ${r.ok ? (r.skipped ? "désactivé" : `${r.nouveaux} nouveau${r.nouveaux > 1 ? "x" : ""}`) : r.code === "not_configured" ? "non configuré" : "erreur"}`).join(" · "),
        },
      )
      // Les erreurs détaillées restent affichées sur les cartes des comptes
      if (results.some((r) => !r.ok && r.code !== "not_configured")) setTimeout(() => document.getElementById("comptes")?.scrollIntoView({ behavior: "smooth" }), 300)
      await load()
    } catch { /* message déjà affiché */ } finally {
      setSyncing(false)
    }
  }

  const setStatus = async (post: Post, status: Post["status"], undo = true) => {
    const previous = post.status
    setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, status } : p)))
    try {
      await adminFetch(`/api/social-media/${post.id}/validate`, { method: "PUT", json: { status } })
      const label = post.title ? `« ${post.title.slice(0, 60)} »` : "La publication"
      const text: Record<Post["status"], [string, string]> = {
        approved: [`${label} publiée`, "Elle apparaît dans « Sur nos réseaux », dans « À la une » de l'accueil."],
        hidden: [`${label} masquée`, "Elle ne s'affiche plus sur le site. Rien n'est supprimé."],
        rejected: [`${label} refusée`, "Elle ne sera jamais affichée, même après une nouvelle synchronisation."],
        pending: [`${label} remise en attente`, "Elle n'est plus visible sur le site."],
      }
      const [title, detail] = text[status]
      if (undo) notify.undoable(title, () => setStatus({ ...post, status }, previous, false), { detail, id: `post-${post.id}` })
      else notify.success(title, { detail, id: `post-${post.id}-annule` })
    } catch (e) {
      setPosts((list) => list.map((p) => (p.id === post.id ? { ...p, status: previous } : p)))
      notify.error("Modification impossible", { erreur: e, reessayer: () => setStatus(post, status, undo) })
    }
  }

  const remove = async (post: Post) => {
    const choice = await askConfirm({
      title: "Supprimer cette publication de la liste ?",
      description: (
        <>
          Elle disparaît de l'admin et du site. <strong>Attention :</strong> si elle existe toujours sur {NAMES[post.platform]},
          elle reviendra « en attente » à la prochaine synchronisation. Pour l'écarter définitivement, choisissez plutôt « Refuser ».
        </>
      ),
      confirmLabel: "Supprimer",
      alternative: { label: "Refuser plutôt" },
    })
    if (choice === "alt") return setStatus(post, "rejected")
    if (choice !== true) return
    try {
      await adminFetch(`/api/social-media/${post.id}`, { method: "DELETE" })
      setPosts((list) => list.filter((p) => p.id !== post.id))
      notify.success("Publication supprimée de la liste")
    } catch (e) {
      notify.error("Suppression impossible", { erreur: e, reessayer: () => remove(post) })
    }
  }

  // Filtre par réseau, puis par statut ; toujours du plus récent au plus ancien
  const byNet = net === "all" ? posts : posts.filter((p) => p.platform === net)
  const counts = Object.fromEntries(STATUS_TABS.map((t) => [t.key, byNet.filter((p) => p.status === t.key).length])) as Record<Post["status"], number>
  const shown = byNet
    .filter((p) => p.status === tab)
    .sort((a, b) => (b.publishedAt ? Date.parse(b.publishedAt) : 0) - (a.publishedAt ? Date.parse(a.publishedAt) : 0))
  const networks = (Object.keys(NAMES) as Platform[]).filter((n) => posts.some((p) => p.platform === n))
  const configured = accounts?.filter((a) => a.configured).length ?? 0


  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AdminPageHeader
        section="social"
        actions={
          <Button onClick={syncNow} disabled={syncing || configured === 0} title={configured === 0 ? "Configurez d'abord au moins un compte" : undefined}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? "Synchronisation…" : "Synchroniser maintenant"}
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          {syncHours === "0"
            ? <>La synchronisation automatique est <strong className="text-foreground">désactivée</strong> : utilisez « Synchroniser maintenant ».</>
            : <>La synchronisation se fait aussi <strong className="text-foreground">automatiquement toutes les {syncHours} heures</strong>.</>}{" "}
          (<Link href="/admin/settings" className="text-or underline">modifier le rythme</Link>). Les nouvelles publications arrivent
          « en attente » : rien n'est montré sur le site sans votre accord (sauf si « Publier automatiquement » est activé pour un réseau).
        </p>
        <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
          <span className="font-medium">Dans le haut de l'accueil : toutes les publications « Publiées ».</span>{" "}
          <span className="text-muted-foreground">La plus récente passe en premier, avant vos annonces ; les autres suivent dans la rotation. Pour en retirer une, cliquez sur « Masquer ».</span>
        </p>
      </AdminPageHeader>

      {loadError && (
        <div role="alert" className="mb-6 flex flex-col gap-3 rounded-lg border border-[var(--rouge)]/50 bg-[var(--rouge)]/10 px-4 py-3 text-sm sm:flex-row sm:items-center">
          <CircleAlert className="h-5 w-5 shrink-0 text-[var(--rouge-texte)]" />
          <span className="flex-1">Impossible de charger les réseaux sociaux : {loadError}</span>
          <Button size="sm" variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /> Réessayer</Button>
        </div>
      )}

      {/* ------------------------------ Comptes ------------------------------ */}
      <section id="comptes" className="scroll-mt-20">
        <h2 className="font-display text-3xl">Comptes connectés</h2>
        <p className="mt-1 text-sm text-muted-foreground">{accounts ? `${configured} réseau${configured > 1 ? "x" : ""} sur 4 configuré${configured > 1 ? "s" : ""}.` : "Chargement…"}</p>
        <div className="mt-5 grid items-start gap-4 lg:grid-cols-2">
          {(accounts ?? []).map((a) => (
            <AccountCard
              key={a.platform}
              account={a}
              open={openForm === a.platform}
              onToggleForm={() => setOpenForm(openForm === a.platform ? null : a.platform)}
              onChanged={load}
            />
          ))}
          {!accounts && !loadError && [0, 1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-card" />)}
        </div>
      </section>

      {/* ---------------------------- Publications ---------------------------- */}
      <section className="mt-14">
        <h2 className="font-display text-3xl">Publications</h2>

        {/* Réseau (seulement ceux qui ont des publications) */}
        {networks.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtrer par réseau">
            <span className="mr-1 text-xs text-muted-foreground">Réseau :</span>
            {(["all", ...networks] as ("all" | Platform)[]).map((n) => {
              const Icon = n === "all" ? null : ICONS[n]
              const total = n === "all" ? posts.length : posts.filter((p) => p.platform === n).length
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={net === n}
                  onClick={() => setNet(n)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-sm transition-colors ${net === n ? "border-or text-or" : "border-border text-foreground/70 hover:border-or/50"}`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {n === "all" ? "Tous" : NAMES[n]}
                  <span className="text-xs text-muted-foreground">{total}</span>
                </button>
              )
            })}
          </div>
        )}

        <div role="tablist" aria-label="Statut des publications" className="mt-4 flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              title={t.hint}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${tab === t.key ? "border-or bg-or/15 text-foreground" : "border-border text-foreground/70 hover:border-or/50"}`}
            >
              {t.label}
              <span className={`ml-2 rounded-full px-1.5 text-xs ${t.key === "pending" && counts.pending > 0 ? "bg-[var(--rouge)] text-[#fff]" : "bg-muted text-muted-foreground"}`}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{STATUS_TABS.find((t) => t.key === tab)?.hint}</p>

        {shown.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
            {tab === "pending"
              ? configured === 0
                ? "Aucune publication : configurez d'abord un compte ci-dessus, puis lancez une synchronisation."
                : "Rien à valider pour le moment."
              : "Aucune publication dans cette catégorie."}
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((p) => (
              <PostCard key={p.id} post={p} onStatus={(s) => setStatus(p, s)} onDelete={() => remove(p)} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

/* ------------------------------- Carte d'un compte ------------------------------ */

function AccountCard({ account: a, open, onToggleForm, onChanged }: {
  account: Account
  open: boolean
  onToggleForm: () => void
  onChanged: () => Promise<void> | void
}) {
  const Icon = ICONS[a.platform]
  const [values, setValues] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<"save" | "test" | "connect" | null>(null)

  useEffect(() => {
    if (open) setValues(Object.fromEntries(a.fields.filter((f) => !f.secret).map((f) => [f.key, f.value ?? ""])))
  }, [open, a.fields])

  const state = !a.configured
    ? { label: "Non configuré", cls: "border-border text-muted-foreground", Icon: CircleDashed }
    : a.lastError
      ? { label: "Erreur", cls: "border-[var(--rouge)]/50 text-[var(--rouge-texte)]", Icon: CircleAlert }
      : a.accountName
        ? { label: "Connecté", cls: "border-[var(--succes)]/50 text-[var(--succes)]", Icon: CheckCircle2 }
        : { label: "Configuré, pas encore testé", cls: "border-or/40 text-or", Icon: CircleDashed }

  const test = async (silentSuccess = false) => {
    setBusy("test")
    try {
      const r = await adminFetch<{ ok: boolean; name?: string; count?: number; error?: string }>(`/api/social-media/accounts/${a.platform}/test`, { method: "POST" })
      if (r.ok) {
        if (!silentSuccess) notify.success(`${a.name} : connexion réussie`, { detail: `Compte « ${r.name} » · ${r.count} publication${(r.count ?? 0) > 1 ? "s" : ""} récente${(r.count ?? 0) > 1 ? "s" : ""} trouvée${(r.count ?? 0) > 1 ? "s" : ""}.` })
        else notify.success(`${a.name} enregistré et connecté`, { detail: `Compte « ${r.name} ».` })
      } else {
        notify.error(`${a.name} : connexion impossible`, { detail: r.error, reessayer: () => test(silentSuccess) })
      }
      await onChanged()
    } catch (e) {
      notify.error(`${a.name} : test impossible`, { erreur: e })
    } finally {
      setBusy(null)
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy("save")
    try {
      await adminFetch(`/api/social-media/accounts/${a.platform}`, { method: "PUT", json: { credentials: values } })
      setValues({})
      await onChanged()
      onToggleForm()
      setBusy(null)
      // On vérifie tout de suite que les identifiants fonctionnent
      await test(true)
    } catch (err) {
      notify.error(`${a.name} : enregistrement impossible`, { erreur: err })
      setBusy(null)
    }
  }

  const patch = async (data: { enabled?: boolean; autoApprove?: boolean }) => {
    try {
      await adminFetch(`/api/social-media/accounts/${a.platform}`, { method: "PUT", json: data })
      if (data.enabled !== undefined) notify.success(data.enabled ? `${a.name} réactivé` : `${a.name} désactivé`, { detail: data.enabled ? "Il sera de nouveau synchronisé." : "Il n'est plus synchronisé. Les publications déjà publiées restent visibles." })
      if (data.autoApprove !== undefined) notify.success(data.autoApprove ? `${a.name} : publication automatique` : `${a.name} : validation manuelle`, { detail: data.autoApprove ? "Les nouvelles publications s'afficheront sur le site sans validation." : "Les nouvelles publications attendront votre validation." })
      await onChanged()
    } catch (e) {
      notify.error("Modification impossible", { erreur: e })
    }
  }

  const connectTikTok = async () => {
    setBusy("connect")
    try {
      const { url } = await adminFetch<{ url: string }>("/api/social-media/tiktok/connect")
      window.location.href = url
    } catch (e) {
      notify.error("Connexion TikTok impossible", { erreur: e })
      setBusy(null)
    }
  }

  return (
    <article className={`rounded-lg border bg-card p-5 ${a.lastError && a.configured ? "border-[var(--rouge)]/40" : "border-border"} ${a.enabled ? "" : "opacity-70"}`}>
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-or/40 text-or"><Icon className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{a.name}</h3>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${state.cls}`}><state.Icon className="h-3 w-3" />{state.label}</span>
          </div>
          {a.accountName && <p className="text-sm text-muted-foreground">{a.accountName}</p>}
          {a.lastSyncAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Dernière synchro {fmtAgo(a.lastSyncAt)}{a.lastCount !== null && !a.lastError ? ` · ${a.lastCount} nouvelle${a.lastCount > 1 ? "s" : ""}` : ""}
            </p>
          )}
        </div>
      </div>

      {a.lastError && a.configured && (
        <p className="mt-3 rounded-md border border-[var(--rouge)]/40 bg-[var(--rouge)]/10 px-3 py-2 text-sm">{a.lastError}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        <label className="flex items-center gap-2">
          <Switch checked={a.enabled} onCheckedChange={(v) => patch({ enabled: v })} aria-label={`Synchroniser ${a.name}`} />
          Synchroniser
        </label>
        <label className="flex items-center gap-2" title="Sans validation manuelle : les nouvelles publications s'affichent directement sur le site">
          <Switch checked={a.autoApprove} onCheckedChange={(v) => patch({ autoApprove: v })} aria-label={`Publier automatiquement ${a.name}`} />
          Publier automatiquement
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant={open ? "default" : "outline"} onClick={onToggleForm}>
          <Settings2 className="h-4 w-4" /> {a.configured ? "Modifier les identifiants" : "Configurer"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => test()} disabled={!a.configured || busy !== null}>
          {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Tester
        </Button>
        {a.platform === "tiktok" && (
          <Button size="sm" variant="outline" onClick={connectTikTok} disabled={busy !== null}>
            {busy === "connect" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Connecter TikTok
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={save} className="mt-5 space-y-4 border-t border-border pt-5">
          <div className="rounded-md bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
            <p className="mb-1.5 font-semibold text-foreground">Où trouver ces informations ?</p>
            {GUIDES[a.platform]}
          </div>
          {a.fields.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`${a.platform}-${f.key}`}>{f.label}{f.required && <span className="text-[var(--rouge-texte)]"> *</span>}</Label>
              <Input
                id={`${a.platform}-${f.key}`}
                className="mt-1.5"
                type={f.secret ? "password" : "text"}
                autoComplete="off"
                value={values[f.key] ?? ""}
                placeholder={f.secret ? (f.masked ? `${f.masked} (enregistré)` : "Non renseigné") : ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
              {f.secret && f.masked && <FieldHelp>Laissez vide pour garder la valeur enregistrée.</FieldHelp>}
              {f.source === "env" && <FieldHelp>Valeur actuelle lue dans le fichier .env du serveur : une valeur saisie ici la remplacera.</FieldHelp>}
              {f.source === "facebook" && <FieldHelp>Le jeton de la Page Facebook est utilisé.</FieldHelp>}
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy !== null}>
              {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Enregistrer et tester
            </Button>
            <Button type="button" variant="outline" onClick={onToggleForm}>Annuler</Button>
          </div>
        </form>
      )}
    </article>
  )
}

/* ---------------------------- Carte d'une publication --------------------------- */

function PostCard({ post: p, onStatus, onDelete }: { post: Post; onStatus: (s: Post["status"]) => void; onDelete: () => void }) {
  const Icon = ICONS[p.platform]
  const thumb = p.localThumbnail || p.thumbnailUrl
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative aspect-video bg-muted">
        {thumb ? (
          <img src={getImageUrl(thumb)} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="grid h-full place-items-center text-muted-foreground"><Icon className="h-10 w-10" /></div>
        )}
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#000]/70 px-2 py-0.5 text-xs text-[#fff]"><Icon className="h-3 w-3" />{NAMES[p.platform]}</span>
        {p.isVideo && <span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-[#000]/60 text-[#fff]"><Play className="ml-0.5 h-5 w-5" /></span></span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs text-muted-foreground">{fmtDate(p.publishedAt)}{p.author ? ` · ${p.author}` : ""}</p>
        <h3 className="mt-1 line-clamp-2 font-semibold">{p.title || "Sans titre"}</h3>
        {p.content && p.content !== p.title && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{p.content}</p>}
        {p.mediaUrl && (
          <a href={p.mediaUrl} target="_blank" rel="noopener" className="mt-2 inline-flex items-center gap-1 text-sm text-or hover:underline">
            Ouvrir sur {NAMES[p.platform]} <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {p.status === "pending" && (
            <>
              <Button size="sm" onClick={() => onStatus("approved")}><ThumbsUp className="h-4 w-4" /> Publier</Button>
              <Button size="sm" variant="outline" onClick={() => onStatus("rejected")}><ThumbsDown className="h-4 w-4" /> Refuser</Button>
            </>
          )}
          {p.status === "approved" && <Button size="sm" variant="outline" onClick={() => onStatus("hidden")}><EyeOff className="h-4 w-4" /> Masquer</Button>}
          {p.status === "hidden" && <Button size="sm" onClick={() => onStatus("approved")}><Eye className="h-4 w-4" /> Réafficher</Button>}
          {p.status === "rejected" && <Button size="sm" variant="outline" onClick={() => onStatus("pending")}><Undo2 className="h-4 w-4" /> Remettre en attente</Button>}
          <Button size="sm" variant="ghost" onClick={onDelete} title="Supprimer de la liste" aria-label="Supprimer de la liste" className="ml-auto">
            <Trash2 className="h-4 w-4 text-[var(--rouge-texte)]" />
          </Button>
        </div>
      </div>
    </article>
  )
}
