/**
 * Planificateur unique des taches automatiques.
 *
 * Toutes les 5 minutes, il relit les reglages (table Settings, page admin
 * Parametres → Rythmes et automatismes) et lance les taches dont c'est l'heure.
 * Un changement de reglage s'applique donc sans redemarrer le serveur.
 *
 *   social      : synchronisation des reseaux sociaux, toutes les N heures
 *   translation : traduction des contenus manquants (mode « planifie »)
 *   newsletter  : envoi automatique (quotidien / hebdomadaire / mensuel)
 *   reminders   : rappels d'evenements (la veille et le jour meme)
 *   links       : controle des liens (404…), toutes les N heures, alerte email
 *
 * Chaque tache memorise son dernier passage (job_<cle>_last_run) et son
 * compte rendu (job_<cle>_last_result) pour l'affichage dans l'admin.
 */
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const HOUR = 60 * 60 * 1000;
const TZ = 'Europe/Brussels';

const DEFAULTS = {
  social_sync_hours: '6',
  translation_mode: 'immediate',
  translation_interval_hours: '24',
  newsletter_auto_enabled: 'false',
  newsletter_frequency: 'weekly',
  newsletter_day: 'monday',
  newsletter_time: '09:00',
  newsletter_reminders: 'true',
  links_check_mode: 'auto',
  links_check_interval_hours: '168',
  links_alert_email: '',
};

const LINKS_FREQ = { 24: 'tous les jours', 72: 'tous les 3 jours', 168: 'chaque semaine', 720: 'chaque mois' };
const linksHours = (s) => Number(s.links_check_interval_hours) || 168;

const escapeHtml = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Email recapitulatif des liens nouvellement casses. */
async function sendLinksAlert(s, newlyBroken, totals, send) {
  let to = String(s.links_alert_email || '').split(/[,;\s]+/).filter(Boolean);
  if (to.length === 0) to = (await prisma.admin.findMany({ select: { email: true } })).map((a) => a.email);
  if (to.length === 0) return 'aucun destinataire';
  const front = (process.env.FRONTEND_URL || 'https://www.cmcibelgique.org').replace(/\/$/, '');
  const shown = newlyBroken.slice(0, 50);
  const rows = shown.map((l) => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(l.label)}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;word-break:break-all"><a href="${escapeHtml(l.url)}">${escapeHtml(l.url)}</a></td>
      <td style="padding:6px 8px;border-bottom:1px solid #eee;white-space:nowrap">${escapeHtml(l.status ?? '—')} ${escapeHtml(l.error || '')}</td>
    </tr>`).join('');
  const more = newlyBroken.length > shown.length ? `<p>… et ${newlyBroken.length - shown.length} autre(s).</p>` : '';
  const html = `
    <div style="font-family:Arial,sans-serif;color:#222;max-width:760px">
      <h2 style="margin:0 0 8px">${newlyBroken.length} lien(s) cassé(s) détecté(s)</h2>
      <p>Le contrôle automatique a testé ${totals.checked} liens du site : ${totals.broken} cassé(s) au total, ${totals.warning} à vérifier.</p>
      <table style="border-collapse:collapse;width:100%;font-size:13px">
        <tr style="background:#f6f2e7;text-align:left"><th style="padding:6px 8px">Contenu</th><th style="padding:6px 8px">Lien</th><th style="padding:6px 8px">Réponse</th></tr>
        ${rows}
      </table>
      ${more}
      <p style="margin-top:16px"><a href="${front}/admin/links">Ouvrir le contrôle des liens dans l'administration</a></p>
    </div>`;
  const r = await send({ to: to.join(','), subject: `CMCI Belgique — ${newlyBroken.length} lien(s) cassé(s)`, html });
  return r && r.success === false ? `email non envoyé (${r.error})` : `email envoyé à ${to.join(', ')}`;
}

const DAYS_FR = { monday: 'lundi', tuesday: 'mardi', wednesday: 'mercredi', thursday: 'jeudi', friday: 'vendredi', saturday: 'samedi', sunday: 'dimanche' };

async function readSettings() {
  const rows = await prisma.settings.findMany();
  const s = { ...DEFAULTS };
  for (const r of rows) s[r.key] = r.value;
  return s;
}

async function setSetting(key, value) {
  await prisma.settings.upsert({ where: { key }, update: { value }, create: { key, value } });
}

/** Date et heure a Bruxelles (le serveur peut etre dans un autre fuseau). */
function brussels(date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', weekday: 'long', hourCycle: 'h23',
    }).formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    dayKey: `${parts.year}-${parts.month}-${parts.day}`,
    day: Number(parts.day),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    weekday: parts.weekday.toLowerCase(),
  };
}

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm || '09:00').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};
const lastRun = (s, key) => Date.parse(s[`job_${key}_last_run`] || '') || 0;

/** L'heure d'envoi du jour est-elle passee, et le jour correspond-il a la frequence ? */
function newsletterSlot(s, now) {
  const b = brussels(now);
  const freq = s.newsletter_frequency;
  const rightDay = freq === 'daily' || (freq === 'weekly' && b.weekday === s.newsletter_day) || (freq === 'monthly' && b.day === 1);
  return { rightDay, timeReached: b.minutes >= toMinutes(s.newsletter_time), dayKey: b.dayKey };
}

function newsletterScheduleText(s) {
  const at = `à ${s.newsletter_time}`;
  if (s.newsletter_frequency === 'daily') return `Tous les jours ${at}`;
  if (s.newsletter_frequency === 'monthly') return `Le 1er de chaque mois ${at}`;
  return `Chaque ${DAYS_FR[s.newsletter_day] || s.newsletter_day} ${at}`;
}

/* ---------------------------------- taches --------------------------------- */

const JOBS = {
  social: {
    label: 'Synchronisation des réseaux sociaux',
    enabled: (s) => Number(s.social_sync_hours) > 0,
    due: (s, now) => now - lastRun(s, 'social') >= Number(s.social_sync_hours) * HOUR,
    next: (s) => (Number(s.social_sync_hours) > 0 ? new Date((lastRun(s, 'social') || Date.now()) + Number(s.social_sync_hours) * HOUR).toISOString() : null),
    schedule: (s) => (Number(s.social_sync_hours) > 0 ? `Toutes les ${s.social_sync_hours} h` : 'Désactivée'),
    async run(deps) {
      const syncAll = deps.syncAll || require('./social-media.service').syncAll;
      const results = await syncAll();
      const active = results.filter((r) => r.code !== 'not_configured' && !r.skipped);
      if (active.length === 0) return { ok: true, message: 'Aucun réseau configuré.' };
      const added = active.reduce((n, r) => n + (r.nouveaux || 0), 0);
      const failed = active.filter((r) => !r.ok);
      const names = { youtube: 'YouTube', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };
      return {
        ok: failed.length === 0,
        message: `${added} nouvelle(s) publication(s)` + (failed.length ? ` · erreur : ${failed.map((r) => names[r.platform]).join(', ')}` : ''),
      };
    },
  },

  translation: {
    label: 'Traduction des nouveaux contenus',
    enabled: (s) => s.translation_mode === 'scheduled',
    due: (s, now) => now - lastRun(s, 'translation') >= Number(s.translation_interval_hours || 24) * HOUR,
    next: (s) => (s.translation_mode === 'scheduled' ? new Date((lastRun(s, 'translation') || Date.now()) + Number(s.translation_interval_hours || 24) * HOUR).toISOString() : null),
    schedule: (s) => ({
      immediate: 'Immédiate, à chaque enregistrement',
      scheduled: `Regroupée, toutes les ${s.translation_interval_hours || 24} h`,
      manual: 'Manuelle (page Traductions)',
    }[s.translation_mode] || 'Immédiate'),
    async run(deps) {
      const backfillMissing = deps.backfillMissing || require('./translation.service').backfillMissing;
      const estimate = await backfillMissing({ dryRun: true });
      if (estimate.characters === 0) return { ok: true, message: 'Rien à traduire : tout est à jour.' };
      const done = await backfillMissing({ dryRun: false });
      return { ok: true, message: `${done.records} contenu(s) traduit(s) (${done.characters} caractères).` };
    },
  },

  newsletter: {
    label: 'Newsletter automatique',
    enabled: (s) => s.newsletter_auto_enabled === 'true',
    due: (s, now) => {
      const slot = newsletterSlot(s, now);
      return slot.rightDay && slot.timeReached && s.job_newsletter_day !== slot.dayKey;
    },
    next: () => null,
    schedule: (s) => (s.newsletter_auto_enabled === 'true' ? newsletterScheduleText(s) : 'Désactivée (page Newsletter)'),
    async run(deps, now, s) {
      await setSetting('job_newsletter_day', newsletterSlot(s, now).dayKey); // une seule fois par jour, meme en cas d'echec
      const send = deps.sendPeriodicNewsletter || require('./newsletter-cron.service').sendPeriodicNewsletter;
      const r = await send({ now, send: deps.sendEmail });
      return { ok: true, message: r.message };
    },
  },

  reminders: {
    label: 'Rappels d\'événements (la veille et le jour même)',
    enabled: (s) => s.newsletter_reminders === 'true',
    due: (s, now) => {
      const b = brussels(now);
      return b.minutes >= toMinutes(s.newsletter_time) && s.job_reminders_day !== b.dayKey;
    },
    next: () => null,
    schedule: (s) => (s.newsletter_reminders === 'true' ? `Chaque jour à ${s.newsletter_time}` : 'Désactivés'),
    async run(deps, now) {
      await setSetting('job_reminders_day', brussels(now).dayKey);
      const send = deps.sendEventReminders || require('./newsletter-cron.service').sendEventReminders;
      const r = await send({ now, send: deps.sendEmail });
      return { ok: true, message: r.message };
    },
  },
};

JOBS.links = {
  label: 'Contrôle des liens',
  enabled: (s) => s.links_check_mode === 'auto',
  due: (s, now) => now - lastRun(s, 'links') >= linksHours(s) * HOUR,
  next: (s) => new Date(lastRun(s, 'links') ? lastRun(s, 'links') + linksHours(s) * HOUR : Date.now()).toISOString(),
  schedule: (s) => (s.links_check_mode === 'auto'
    ? `Automatique, ${LINKS_FREQ[linksHours(s)] || `toutes les ${linksHours(s)} h`}`
    : 'Manuel (page Contrôle des liens)'),
  async run(deps, now, s) {
    const runLinkCheck = deps.runLinkCheck || require('./link-checker.service').runLinkCheck;
    const r = await runLinkCheck();
    let message = `${r.checked} lien(s) contrôlé(s) · ${r.broken} cassé(s)`
      + (r.newlyBroken.length ? ` dont ${r.newlyBroken.length} nouveau(x)` : '')
      + (r.warning ? ` · ${r.warning} à vérifier` : '');
    if (r.newlyBroken.length) {
      const send = deps.sendEmail || require('./email.service').sendEmail;
      message += ` · ${await sendLinksAlert(s, r.newlyBroken, r, send)}`;
    }
    return { ok: true, message, broken: r.broken };
  },
};

const running = new Set();

async function runJob(key, { now = new Date(), deps = {}, settings } = {}) {
  const job = JOBS[key];
  if (!job) throw new Error(`Tâche inconnue : ${key}`);
  if (running.has(key)) return { ok: false, message: 'Déjà en cours.' };
  running.add(key);
  const s = settings || (await readSettings());
  let result;
  try {
    result = await job.run(deps, now, s);
  } catch (e) {
    result = { ok: false, message: e.message };
  } finally {
    running.delete(key);
  }
  await setSetting(`job_${key}_last_run`, now.toISOString());
  await setSetting(`job_${key}_last_result`, JSON.stringify(result));
  return result;
}

/**
 * Lance une tache sans attendre sa fin (taches longues comme `links`) :
 * un proxy (nginx) couperait la requete HTTP avant la fin du travail.
 * L'admin suit l'avancement via jobsStatus() (champ `running`).
 */
function startJob(key) {
  if (!JOBS[key]) throw new Error(`Tâche inconnue : ${key}`);
  if (running.has(key)) return { ok: false, started: false, message: 'Déjà en cours.' };
  runJob(key).catch((e) => console.error(`Tache ${key} :`, e.message));
  return { ok: true, started: true, message: 'Lancé en arrière-plan.' };
}

/** Un passage : lance chaque tache active dont c'est l'heure. */
async function tick({ now = new Date(), deps = {} } = {}) {
  const s = await readSettings();
  const ran = {};
  for (const [key, job] of Object.entries(JOBS)) {
    if (!job.enabled(s) || !job.due(s, now) || running.has(key)) continue;
    ran[key] = await runJob(key, { now, deps, settings: s });
  }
  return ran;
}

/** Etat des taches pour l'admin. */
async function jobsStatus() {
  const s = await readSettings();
  return Object.entries(JOBS).map(([key, job]) => {
    let lastResult = null;
    try { lastResult = JSON.parse(s[`job_${key}_last_result`] || 'null'); } catch { /* ancien format */ }
    return {
      key,
      label: job.label,
      enabled: job.enabled(s),
      schedule: job.schedule(s),
      lastRun: s[`job_${key}_last_run`] || null,
      lastResult,
      nextRun: job.enabled(s) ? job.next(s) : null,
      running: running.has(key),
    };
  });
}

function setupScheduler() {
  cron.schedule('*/5 * * * *', () => {
    tick().then((ran) => {
      const keys = Object.keys(ran);
      if (keys.length) console.log(`⏱️  Taches automatiques : ${keys.map((k) => `${k} → ${ran[k].message}`).join(' | ')}`);
    }).catch((e) => console.error('Planificateur :', e.message));
  }, { timezone: TZ });
}

module.exports = { setupScheduler, tick, runJob, startJob, jobsStatus, readSettings, brussels, JOBS };
