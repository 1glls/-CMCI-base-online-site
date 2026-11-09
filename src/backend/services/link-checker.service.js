/**
 * Controle des liens du site.
 *
 * 1. `collectLinks()` dresse le catalogue de tout ce qui peut renvoyer une 404 :
 *    - liens externes saisis dans l'admin (boutons, inscriptions, liens livres,
 *      reseaux sociaux dans les reglages…) ;
 *    - fichiers et images (couvertures, PDF, photos) ;
 *    - pages publiques listees dans le sitemap.
 * 2. `runLinkCheck()` synchronise ce catalogue dans la table LinkCheck puis
 *    teste chaque URL et memorise le resultat (ok / warning / broken).
 *
 * Lance par le planificateur (tache `links`) ou depuis la page admin
 * « Contrôle des liens ».
 */
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SITE = () => (process.env.FRONTEND_URL || 'https://www.cmcibelgique.org').replace(/\/$/, '');
const API = () => (process.env.BACKEND_URL || 'https://api.cmcibelgique.org').replace(/\/$/, '');

const TIMEOUT = 10000;
const CONCURRENCY = 6;
const USER_AGENT = 'Mozilla/5.0 (compatible; CMCI-LinkChecker/1.0)';

/* ------------------------------- catalogue ------------------------------- */

/**
 * Chemin tel que saisi en base -> URL absolue testable (ou null si ce n'est
 * pas un lien : ancre, mailto, nom d'icone…).
 */
function resolveUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v || v.startsWith('#') || /^(mailto|tel|javascript|data):/i.test(v)) return null;
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith('//')) return `https:${v}`;
  if (v.startsWith('/uploads/') || v.startsWith('/api/')) return `${API()}${v}`;
  if (v.startsWith('/')) return `${SITE()}${v}`;
  if (/^www\.[^\s]+\.[a-z]{2,}/i.test(v)) return `https://${v}`;
  return null;
}

const KIND_FILE = 'file';
const KIND_EXTERNAL = 'external';
const KIND_PAGE = 'page';

/** Lit le sitemap public et renvoie la liste des <loc>. */
async function sitemapUrls() {
  try {
    const res = await axios.get(`${SITE()}/sitemap.xml`, { timeout: 20000, headers: { 'User-Agent': USER_AGENT } });
    return [...String(res.data).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  } catch (e) {
    console.error('Controle des liens, sitemap illisible :', e.message);
    return null; // null = ne pas toucher aux entrees « page » existantes
  }
}

/**
 * Catalogue complet. Chaque entree :
 * { url, kind, sourceModel, sourceId, field, label, adminHref }
 * Seuls les contenus publies sont pris en compte : un contenu masque
 * n'est pas visible, ses liens ne peuvent pas gener les visiteurs.
 */
async function collectLinks() {
  const out = [];
  const add = (raw, kind, sourceModel, sourceId, field, label, adminHref) => {
    const url = resolveUrl(raw);
    if (url) out.push({ url, kind, sourceModel, sourceId: sourceId || '', field, label, adminHref });
  };
  const published = { where: { status: 'published' } };

  const [events, slides, ministries, countdowns, testimonials, gallery, books, tracts, settings] = await Promise.all([
    prisma.event.findMany(published),
    prisma.heroSlide.findMany(published),
    prisma.ministry.findMany(published),
    prisma.countdown.findMany(published),
    prisma.testimonial.findMany(published),
    prisma.galleryImage.findMany(published),
    prisma.book.findMany(published),
    prisma.tract.findMany({ where: { status: 'published' }, include: { versions: { where: { status: 'published' } } } }).catch(() => []),
    prisma.settings.findMany({ where: { NOT: { key: { startsWith: 'job_' } } } }),
  ]);

  for (const e of events) {
    const l = `Événement : ${e.title}`;
    add(e.image, KIND_FILE, 'Event', e.id, 'image', l, '/admin/events');
    add(e.registrationUrl, KIND_EXTERNAL, 'Event', e.id, 'registrationUrl', l, '/admin/events');
    add(e.exploreUrl, KIND_EXTERNAL, 'Event', e.id, 'exploreUrl', l, '/admin/events');
  }
  for (const s of slides) {
    const l = `Haut de l'accueil : ${s.title}`;
    add(s.image, KIND_FILE, 'HeroSlide', s.id, 'image', l, '/admin/hero');
    add(s.imageMobile, KIND_FILE, 'HeroSlide', s.id, 'imageMobile', l, '/admin/hero');
    add(s.buttonUrl, KIND_EXTERNAL, 'HeroSlide', s.id, 'buttonUrl', l, '/admin/hero');
  }
  for (const m of ministries) {
    const l = `Ministère : ${m.title}`;
    add(m.image, KIND_FILE, 'Ministry', m.id, 'image', l, '/admin/ministries');
    add(m.link, KIND_EXTERNAL, 'Ministry', m.id, 'link', l, '/admin/ministries');
  }
  for (const c of countdowns) {
    const l = `Compte à rebours : ${c.title}`;
    add(c.image, KIND_FILE, 'Countdown', c.id, 'image', l, '/admin/countdowns');
    add(c.linkUrl, KIND_EXTERNAL, 'Countdown', c.id, 'linkUrl', l, '/admin/countdowns');
  }
  for (const t of testimonials) {
    add(t.image, KIND_FILE, 'Testimonial', t.id, 'image', `Témoignage : ${t.name}`, '/admin/testimonials');
  }
  for (const g of gallery) {
    add(g.src, KIND_FILE, 'GalleryImage', g.id, 'src', `Galerie : ${g.alt || g.category}`, '/admin/gallery');
  }
  for (const b of books) {
    const l = `Livre : ${b.title}${b.language ? ` (${b.language})` : ''}`;
    // Meme regle que routes/books.routes.js : couverture ztfbooks servie par relais.
    add(b.coverKey ? `/api/books/${b.id}/cover` : b.cover, KIND_FILE, 'Book', b.id, 'cover', l, '/admin/books');
    add(b.file, KIND_FILE, 'Book', b.id, 'file', l, '/admin/books');
    add(b.preview, KIND_FILE, 'Book', b.id, 'preview', l, '/admin/books');
    add(b.externalLink, KIND_EXTERNAL, 'Book', b.id, 'externalLink', l, '/admin/books');
  }
  for (const t of tracts) {
    const l = `Tract : ${t.title}`;
    add(t.cover, KIND_FILE, 'Tract', t.id, 'cover', l, '/admin/tracts');
    for (const v of t.versions || []) {
      const lv = `${l} (${v.label || v.language})`;
      add(v.file, KIND_FILE, 'TractVersion', v.id, 'file', lv, '/admin/tracts');
      add(v.htmlSource, KIND_FILE, 'TractVersion', v.id, 'htmlSource', lv, '/admin/tracts');
      let previews = [];
      try { previews = JSON.parse(v.previews || '[]'); } catch { /* ancien format */ }
      (Array.isArray(previews) ? previews : []).forEach((p, i) => add(p, KIND_FILE, 'TractVersion', v.id, `previews[${i}]`, lv, '/admin/tracts'));
    }
  }
  for (const s of settings) {
    if (/^https?:\/\//i.test(String(s.value).trim())) {
      add(s.value, KIND_EXTERNAL, 'Settings', s.key, 'value', `Réglage : ${s.key}`, '/admin/settings');
    }
  }

  const pages = await sitemapUrls();
  for (const loc of pages || []) {
    let path = loc;
    try { path = new URL(loc).pathname || '/'; } catch { /* garde l'URL */ }
    add(loc, KIND_PAGE, 'Sitemap', '', 'loc', `Page : ${path}`, null);
  }

  return { links: out, sitemapOk: pages !== null };
}

/* -------------------------------- controle ------------------------------- */

/**
 * Teste une URL. HEAD d'abord (leger), puis GET si le serveur refuse HEAD
 * (beaucoup de CDN et les liens presignes R2/S3 ne signent que GET).
 * Renvoie { state, status, error }.
 */
async function checkUrl(url) {
  const opts = {
    timeout: TIMEOUT,
    maxRedirects: 5,
    validateStatus: () => true,
    headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
  };
  let res;
  try {
    res = await axios.head(url, opts);
    if ([403, 404, 405, 501].includes(res.status) || res.status >= 500) {
      // GET en flux, abandonne des les en-tetes : on ne telecharge pas le PDF.
      const get = await axios.get(url, { ...opts, responseType: 'stream' });
      get.data?.destroy?.();
      res = get;
    }
  } catch (e) {
    const code = e.code || '';
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') return { state: 'warning', status: null, error: 'Délai dépassé (10 s)' };
    if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') return { state: 'broken', status: null, error: 'Domaine introuvable' };
    if (code === 'ECONNREFUSED') return { state: 'broken', status: null, error: 'Connexion refusée' };
    if (code === 'ERR_FR_TOO_MANY_REDIRECTS') return { state: 'broken', status: null, error: 'Trop de redirections' };
    return { state: 'broken', status: null, error: e.message.slice(0, 200) };
  }
  return classify(res.status);
}

function classify(status) {
  if (status >= 200 && status < 400) return { state: 'ok', status, error: null };
  // Reseaux sociaux et sites proteges : refusent souvent les robots sans que
  // le lien soit casse pour un visiteur. A verifier a la main, pas une alerte.
  if ([401, 403, 429, 999].includes(status)) return { state: 'warning', status, error: 'Accès refusé au robot : à vérifier dans un navigateur' };
  if (status === 404 || status === 410) return { state: 'broken', status, error: 'Introuvable' };
  if (status >= 500) return { state: 'broken', status, error: 'Erreur du serveur distant' };
  return { state: 'broken', status, error: `Réponse HTTP ${status}` };
}

/** Execute `fn` sur chaque element, `limit` a la fois. */
async function pool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

const keyOf = (l) => `${l.sourceModel}|${l.sourceId}|${l.field}|${l.url}`;

/** Met la table LinkCheck en accord avec le catalogue courant. */
async function syncCatalog() {
  const { links, sitemapOk } = await collectLinks();
  const existing = await prisma.linkCheck.findMany();
  const byKey = new Map(existing.map((r) => [keyOf(r), r]));
  const seen = new Set();

  const toCreate = [];
  const toUpdate = [];
  for (const l of links) {
    const k = keyOf(l);
    if (seen.has(k)) continue;
    seen.add(k);
    const row = byKey.get(k);
    if (!row) toCreate.push(l);
    else if (row.label !== l.label || row.adminHref !== l.adminHref || row.kind !== l.kind) {
      toUpdate.push(prisma.linkCheck.update({ where: { id: row.id }, data: { label: l.label, adminHref: l.adminHref, kind: l.kind } }));
    }
  }
  // Sources disparues (contenu supprime ou masque, lien modifie) -> on retire.
  // Si le sitemap n'a pas pu etre lu, on garde les pages connues.
  const stale = existing.filter((r) => !seen.has(keyOf(r)) && !(r.kind === KIND_PAGE && !sitemapOk)).map((r) => r.id);

  if (toCreate.length) await prisma.linkCheck.createMany({ data: toCreate });
  for (let i = 0; i < toUpdate.length; i += 200) await prisma.$transaction(toUpdate.slice(i, i + 200));
  for (let i = 0; i < stale.length; i += 500) await prisma.linkCheck.deleteMany({ where: { id: { in: stale.slice(i, i + 500) } } });

  return { created: toCreate.length, removed: stale.length };
}

/**
 * Controle complet (catalogue + tests), ou seulement les lignes `ids`.
 * Les liens ignores ne sont pas retestes lors d'un controle complet.
 */
async function runLinkCheck({ ids } = {}) {
  const started = Date.now();
  if (!ids) await syncCatalog();

  const rows = await prisma.linkCheck.findMany({
    where: ids ? { id: { in: ids } } : { ignored: false },
  });

  // Une meme URL peut figurer plusieurs fois (meme image sur deux contenus) :
  // on ne la teste qu'une fois.
  const urls = [...new Set(rows.map((r) => r.url))];
  const results = new Map();
  await pool(urls, CONCURRENCY, async (url) => { results.set(url, await checkUrl(url)); });

  const now = new Date();
  const newlyBroken = [];
  const updates = rows.map((r) => {
    const res = results.get(r.url);
    const broken = res.state === 'broken';
    if (broken && r.state !== 'broken' && !r.ignored) {
      newlyBroken.push({ label: r.label, url: r.url, status: res.status, error: res.error, adminHref: r.adminHref });
    }
    return prisma.linkCheck.update({
      where: { id: r.id },
      data: {
        state: res.state, status: res.status, error: res.error, lastCheckedAt: now,
        firstFailedAt: res.state === 'ok' ? null : (r.firstFailedAt || now),
      },
    });
  });
  for (let i = 0; i < updates.length; i += 200) await prisma.$transaction(updates.slice(i, i + 200));

  return { ...(await summary()), checked: rows.length, newlyBroken, durationMs: Date.now() - started };
}

/** Compteurs pour le tableau de bord et la page admin. */
async function summary() {
  const grouped = await prisma.linkCheck.groupBy({ by: ['state', 'ignored'], _count: { _all: true } });
  const s = { total: 0, ok: 0, warning: 0, broken: 0, pending: 0, ignored: 0 };
  for (const g of grouped) {
    const n = g._count._all;
    s.total += n;
    if (g.ignored) s.ignored += n;
    else s[g.state] = (s[g.state] || 0) + n;
  }
  return s;
}

module.exports = { collectLinks, checkUrl, classify, resolveUrl, runLinkCheck, syncCatalog, summary };
