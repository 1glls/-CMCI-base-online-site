/**
 * Synchronisation du catalogue de livres depuis ztfbooks (meme ministere).
 *
 * API JSON publique, sans authentification :
 *   https://apiv2.ztfbooks.com/ebooks-registry/opn/v1/e-books?page=&size=
 * robots.txt autorise l'acces. Chaque enregistrement est un ouvrage dans UNE
 * langue : ztfbooks ne relie pas les editions d'un meme titre entre langues,
 * on ne reconstitue donc pas « un livre en N langues ». Chaque edition
 * devient une entree, la langue etant un badge et un filtre.
 *
 * Les livres ne sont jamais traduits par DeepL : ils arrivent deja dans leur
 * langue de publication, et « Le Vainqueur » doit rester « Le Vainqueur ».
 */

const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const API = 'apiv2.ztfbooks.com';
const LIST_PATH = '/ebooks-registry/opn/v1/e-books';
const SALE_URL = (id) => `https://web.ztfbooks.com/books/${id}`;

/** "FRENCH [FRN]" -> { name: "Français", code: "fr" }. Le code n'est renseigne
 *  que pour les langues du filtre principal ; le reste garde son nom source. */
const LANG_MAP = {
  'ENGLISH [ENG]': { name: 'English', code: 'en' },
  'FRENCH [FRN]': { name: 'Français', code: 'fr' },
  'GERMAN STANDARD [GER]': { name: 'Deutsch', code: 'de' },
  'SPANISH [SPN]': { name: 'Español', code: 'es' },
  'ITALIAN [ITN]': { name: 'Italiano', code: 'it' },
  'SWEDISH [SWD]': { name: 'Svenska', code: 'sv' },
  'POLISH [PQL]': { name: 'Polski', code: 'pl' },
  'KOREAN [KKN]': { name: '한국어', code: 'ko' },
  'CHINESE MANDARIN [CHN]': { name: '中文', code: 'zh' },
  'BENGALI [BNG]': { name: 'বাংলা', code: 'bn' },
  'PANJABI EASTERN [PNJ]': { name: 'ਪੰਜਾਬੀ', code: 'pa' },
  'MALAGASY [MEX]': { name: 'Malagasy', code: 'mg' }
};

function normalizeLanguage(raw) {
  if (LANG_MAP[raw]) return LANG_MAP[raw];
  // Repli : "XYZ ABC [COD]" -> nom en Capitale, code depuis les crochets
  const name = String(raw || '').replace(/\s*\[[^\]]*\]\s*$/, '').trim();
  const pretty = name ? name.charAt(0) + name.slice(1).toLowerCase() : 'Autre';
  const m = String(raw || '').match(/\[([A-Z]{2,3})\]/);
  return { name: pretty, code: m ? m[1].toLowerCase() : null };
}

function priceLabel(book) {
  if (book.freeBook) return 'Gratuit';
  if (book.amount == null) return null;
  const amount = Number(book.amount).toLocaleString('fr-BE', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  return `${amount} ${book.currencyCode || ''}`.trim();
}

function getJson(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({ host: API, path, method: 'GET', headers: { Accept: 'application/json' } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error(`Reponse non JSON (${res.statusCode})`)); }
        });
      });
    req.on('error', reject);
    req.setTimeout(30000, () => req.destroy(new Error('Delai depasse')));
    req.end();
  });
}

/** Recupere toutes les pages du catalogue. */
async function fetchAll() {
  const size = 100;
  const first = await getJson(`${LIST_PATH}?page=0&size=${size}`);
  const total = first.page?.totalElements ?? first.content?.length ?? 0;
  const pages = Math.ceil(total / size);

  let all = [...(first.content || [])];
  for (let p = 1; p < pages; p++) {
    const res = await getJson(`${LIST_PATH}?page=${p}&size=${size}`);
    all = all.concat(res.content || []);
  }
  return all;
}

/** slug stable a partir d'un libelle (accents retires). */
function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

/** upsert d'une categorie ztfbooks, renvoie son id local. */
async function ensureCategory(name) {
  const slug = slugify(name);
  if (!slug) return null;
  const cat = await prisma.category.upsert({
    where: { slug },
    create: { slug, name: name.trim() },
    update: {} // ne pas ecraser un libelle deja edite en admin
  });
  return cat.id;
}

/**
 * Synchronise le catalogue. Idempotent : upsert sur (source, sourceId).
 * Un livre absent de la source passe en "archived" (les liens survivent),
 * jamais supprime. Le drapeau `hidden` est preserve.
 */
async function syncBooks() {
  const books = (await fetchAll()).filter((b) => b.status === 'APPROVED');
  const seen = new Set();
  let created = 0, updated = 0;

  for (const b of books) {
    const sourceId = String(b.id);
    seen.add(sourceId);

    const lang = normalizeLanguage(b.language);
    const catIds = [];
    for (const c of b.categories || []) {
      const id = await ensureCategory(c.name);
      if (id) catIds.push(id);
    }

    const data = {
      title: b.ebookTitle || 'Sans titre',
      author: b.author?.name || null,
      description: b.description || '',
      externalLink: SALE_URL(b.id),
      language: lang.name,
      languageCode: lang.code,
      priceLabel: priceLabel(b),
      coverKey: b.thumbnailFileName || null,
      featured: Boolean(b.featured),
      status: 'published'
    };
    const rel = catIds.map((id) => ({ id }));

    const existing = await prisma.book.findUnique({
      where: { source_sourceId: { source: 'ztfbooks', sourceId } }
    });

    if (existing) {
      // `set` remplace l'ensemble : reflete l'etat courant de la source
      await prisma.book.update({
        where: { id: existing.id },
        data: { ...data, categories: { set: rel } }
      });
      updated++;
    } else {
      await prisma.book.create({
        data: { ...data, source: 'ztfbooks', sourceId, categories: { connect: rel } }
      });
      created++;
    }
  }

  // Archiver les livres ztfbooks disparus de la source
  const archived = await prisma.book.updateMany({
    where: { source: 'ztfbooks', sourceId: { notIn: [...seen] }, status: { not: 'archived' } },
    data: { status: 'archived' }
  });

  return { created, updated, archived: archived.count, total: books.length };
}

/** Resout l'URL presignee d'une couverture (temporaire cote ztfbooks). */
async function resolveCover(coverKey) {
  if (!coverKey) return null;
  const res = await getJson(`/files/v2/files/downloadLink?fileName=${encodeURIComponent(coverKey)}`);
  return res.result || null;
}

module.exports = { fetchAll, syncBooks, resolveCover, normalizeLanguage };
