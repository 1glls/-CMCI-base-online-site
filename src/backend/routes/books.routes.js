const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { deleteUploadedFile } = require('../utils/upload-cleanup');
const { applyTranslations, autoTranslate, changedTranslatableFields } = require('../services/translation.service');
const { syncBooks, resolveCover } = require('../services/ztfbooks.service');

// URL de couverture : notre relais, qui regenere le lien presigne ztfbooks
const coverUrl = (b) => b.coverKey ? `/api/books/${b.id}/cover` : b.cover;

/**
 * Les categories arrivent en JSON depuis un envoi multipart. `connect` a la
 * creation, `set` a la modification : une liste de cases cochees decrit
 * l'etat voulu, pas un ajout.
 */
function parseIds(raw) {
  if (raw === undefined || raw === null || raw === '') return [];
  if (Array.isArray(raw)) return raw;
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
  catch { return String(raw).split(',').map((s) => s.trim()).filter(Boolean); }
}
const connectCategories = (raw) => {
  const ids = parseIds(raw);
  return ids.length ? { categories: { connect: ids.map((id) => ({ id })) } } : {};
};
const setCategories = (raw) => ({
  categories: { set: parseIds(raw).map((id) => ({ id })) }
});

const prisma = new PrismaClient();

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DOC_MIMES = ['application/pdf'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = file.fieldname === 'cover' ? 'covers' : 'files';
    const dir = path.join(__dirname, '..', 'uploads', 'books', sub);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `book-${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = file.fieldname === 'cover' ? IMAGE_MIMES : DOC_MIMES;
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Type non autorise pour « ${file.fieldname} » : ${file.mimetype}`));
  }
});

const uploadFields = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'preview', maxCount: 1 }
]);

const rel = (f) => `/uploads/books/${f.fieldname === 'cover' ? 'covers' : 'files'}/${f.filename}`;

// GET public
router.get('/', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { status: 'published', hidden: false },
      orderBy: [{ order: 'asc' }, { title: 'asc' }],
      include: { categories: { select: { id: true, slug: true, name: true } } }
    });
    // Pas de traduction : un livre garde le titre de sa langue de publication.
    res.json(books.map((b) => ({
      id: b.id, title: b.title, author: b.author, description: b.description,
      cover: coverUrl(b), file: b.file, preview: b.preview,
      externalLink: b.externalLink, source: b.source,
      language: b.language, languageCode: b.languageCode,
      priceLabel: b.priceLabel, featured: b.featured, categories: b.categories
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** GET /api/books/:id/cover — relais vers la couverture ztfbooks (lien presigne). */
router.get('/:id/cover', async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).send('Introuvable');
    if (book.cover && !book.coverKey) return res.redirect(302, book.cover);

    const url = await resolveCover(book.coverKey);
    if (!url) return res.status(404).send('Couverture indisponible');
    // Le lien presigne expire : cache court, jamais definitif
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.redirect(302, url);
  } catch (error) {
    res.status(502).send('Erreur');
  }
});

/** POST /api/books/sync — synchronise le catalogue ztfbooks (admin). */
router.post('/sync', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await syncBooks();
    res.json({ message: 'Synchronisation terminee', ...result });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

/**
 * GET /api/books/stats — audience mesuree sur cmcibelgique.org (admin).
 * Top ouvrages par vues/likes locaux, top categories/series par vues cumulees,
 * et compteurs ztfbooks en regard pour comparaison.
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { status: 'published' },
      include: { categories: { select: { id: true, name: true } } }
    });

    const topBooks = [...books]
      .sort((a, b) => (b.views - a.views) || (b.likes - a.likes))
      .slice(0, 20)
      .map((b) => ({
        id: b.id, title: b.title, language: b.language,
        views: b.views, likes: b.likes,
        sourceDownloads: b.sourceDownloads, sourceLikes: b.sourceLikes
      }));

    // Vues cumulees par categorie (= « serie » chez ztfbooks)
    const byCat = new Map();
    for (const b of books) {
      for (const c of b.categories) {
        const e = byCat.get(c.id) || { id: c.id, name: c.name, views: 0, likes: 0, books: 0 };
        e.views += b.views; e.likes += b.likes; e.books += 1;
        byCat.set(c.id, e);
      }
    }
    const topCategories = [...byCat.values()]
      .sort((a, b) => b.views - a.views).slice(0, 20);

    const totals = books.reduce((t, b) => ({
      views: t.views + b.views, likes: t.likes + b.likes
    }), { views: 0, likes: 0 });

    res.json({ topBooks, topCategories, totals, totalBooks: books.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/books/group — relie plusieurs editions comme un meme ouvrage (admin).
 * Genere un workKey partage. Reutilise un workKey deja present dans la selection.
 */
router.post('/group', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const ids = parseIds(req.body.ids);
    if (ids.length < 2) return res.status(400).json({ error: 'Au moins deux livres requis' });
    const existing = await prisma.book.findFirst({
      where: { id: { in: ids }, workKey: { not: null } }, select: { workKey: true }
    });
    const workKey = existing?.workKey || require('crypto').randomUUID();
    await prisma.book.updateMany({ where: { id: { in: ids } }, data: { workKey } });
    res.json({ workKey, count: ids.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** POST /api/books/ungroup — dissocie un livre de son groupe (admin). */
router.post('/ungroup', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id requis' });
    await prisma.book.update({ where: { id }, data: { workKey: null } });
    res.json({ message: 'Dissocie' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      orderBy: [{ order: 'asc' }, { title: 'asc' }], include: { categories: true }
    });
    res.json(books.map((b) => ({ ...b, coverDisplay: coverUrl(b) }))); // workKey deja dans ...b
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/books/:id — fiche publique d'un livre + editions soeurs (memes workKey).
 * Enregistre APRES les routes litterales (/all, /sync, /stats) pour ne pas les capter.
 * Pas de traduction : le livre garde le titre de sa langue de publication.
 */
router.get('/:id', async (req, res) => {
  try {
    const b = await prisma.book.findFirst({
      where: { id: req.params.id, status: 'published', hidden: false },
      include: { categories: { select: { id: true, slug: true, name: true } } }
    });
    if (!b) return res.status(404).json({ error: 'Livre introuvable' });

    let siblings = [];
    if (b.workKey) {
      const others = await prisma.book.findMany({
        where: { workKey: b.workKey, status: 'published', hidden: false, id: { not: b.id } },
        select: { id: true, language: true, languageCode: true, externalLink: true }
      });
      siblings = others;
    }

    res.json({
      id: b.id, title: b.title, author: b.author, description: b.description,
      cover: coverUrl(b), file: b.file, preview: b.preview,
      externalLink: b.externalLink, source: b.source,
      language: b.language, languageCode: b.languageCode,
      priceLabel: b.priceLabel, discountPercentage: b.discountPercentage,
      pages: b.pages, readMinutes: b.readMinutes, publisherName: b.publisherName,
      likes: b.likes, categories: b.categories, siblings
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** POST /api/books/:id/view — incremente l'audience CMCI (une fois par session cote client). */
router.post('/:id/view', async (req, res) => {
  try {
    await prisma.book.update({ where: { id: req.params.id }, data: { views: { increment: 1 } } });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** POST /api/books/:id/like — « J'aime » public. Renvoie le total. */
router.post('/:id/like', async (req, res) => {
  try {
    const b = await prisma.book.update({
      where: { id: req.params.id }, data: { likes: { increment: 1 } }, select: { likes: true }
    });
    res.json({ likes: b.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** POST /api/books/:id/unlike — retire un « J'aime » (plancher a 0). */
router.post('/:id/unlike', async (req, res) => {
  try {
    const cur = await prisma.book.findUnique({ where: { id: req.params.id }, select: { likes: true } });
    if (!cur) return res.status(404).json({ error: 'Livre introuvable' });
    const b = await prisma.book.update({
      where: { id: req.params.id }, data: { likes: Math.max(0, cur.likes - 1) }, select: { likes: true }
    });
    res.json({ likes: b.likes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, uploadFields, async (req, res) => {
  try {
    const { title, author, description, externalLink, order, status, featured, categoryIds } = req.body;
    if (!title) return res.status(400).json({ error: 'title requis' });

    const book = await prisma.book.create({
      data: {
        title, author: author || null, description: description || '',
        cover: req.files?.cover?.[0] ? rel(req.files.cover[0]) : null,
        file: req.files?.file?.[0] ? rel(req.files.file[0]) : null,
        preview: req.files?.preview?.[0] ? rel(req.files.preview[0]) : null,
        externalLink: externalLink || null,
        order: Number(order) || 0,
        featured: featured === undefined ? true : (featured === 'true' || featured === true),
        status: status || 'published',
        ...connectCategories(categoryIds)
      }
    });
    autoTranslate('Book', book);
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, uploadFields, async (req, res) => {
  try {
    const { title, author, description, externalLink, order, status, featured, hidden, categoryIds } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (author !== undefined) data.author = author || null;
    if (description !== undefined) data.description = description;
    if (externalLink !== undefined) data.externalLink = externalLink || null;
    if (order !== undefined) data.order = Number(order);
    if (status !== undefined) data.status = status;
    if (featured !== undefined) data.featured = featured === 'true' || featured === true;
    if (hidden !== undefined) data.hidden = hidden === 'true' || hidden === true;
    if (req.files?.cover?.[0]) data.cover = rel(req.files.cover[0]);
    if (req.files?.file?.[0]) data.file = rel(req.files.file[0]);
    if (req.files?.preview?.[0]) data.preview = rel(req.files.preview[0]);
    if (categoryIds !== undefined) Object.assign(data, setCategories(categoryIds));

    res.json(await prisma.book.update({
      where: { id: req.params.id }, data, include: { categories: true }
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ error: 'Livre introuvable' });

    await prisma.book.delete({ where: { id: req.params.id } });
    await deleteUploadedFile(book.cover);
    await deleteUploadedFile(book.file);
    await deleteUploadedFile(book.preview);

    res.json({ message: 'Livre supprime' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
