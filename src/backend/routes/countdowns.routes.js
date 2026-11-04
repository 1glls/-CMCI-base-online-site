const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { applyTranslations, autoTranslate, changedTranslatableFields } = require('../services/translation.service');
const { deleteUploadedFile } = require('../utils/upload-cleanup');

const { addStatusRoute } = require('../utils/status-route');
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Creation a la volee : le dossier n'existe pas sur un serveur deja installe
    const dir = path.join(__dirname, '..', 'uploads', 'countdowns');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'countdown-' + unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) return cb(null, true);
    cb(new Error('Images uniquement'));
  }
});

const bool = (v) => v === true || v === 'true';
const textOrNull = (v) => (v === undefined ? undefined : (String(v).trim() || null));

/**
 * Champs envoyes par le formulaire admin (multipart). Les dates arrivent en
 * ISO : le navigateur convertit l'heure locale saisie avant l'envoi.
 */
function readBody(body) {
  const data = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  for (const f of ['subtitle', 'location', 'schedule', 'info', 'linkUrl', 'linkLabel']) {
    const v = textOrNull(body[f]);
    if (v !== undefined) data[f] = v;
  }
  if (body.startsAt !== undefined) data.startsAt = new Date(body.startsAt);
  if (body.endsAt !== undefined) data.endsAt = new Date(body.endsAt);
  if (body.showBanner !== undefined) data.showBanner = bool(body.showBanner);
  if (body.showHome !== undefined) data.showHome = bool(body.showHome);
  if (body.priority !== undefined) data.priority = parseInt(body.priority, 10) || 0;
  if (body.status !== undefined) data.status = body.status === 'draft' ? 'draft' : 'published';
  return data;
}

function invalidDates(start, end) {
  if (Number.isNaN(start?.getTime()) || Number.isNaN(end?.getTime())) return 'Dates invalides';
  if (end <= start) return 'La fin doit etre apres le debut';
  return null;
}

// GET public : comptes publies et pas encore termines
router.get('/', async (req, res) => {
  try {
    const countdowns = await prisma.countdown.findMany({
      where: { status: 'published', endsAt: { gt: new Date() } },
      orderBy: [{ priority: 'asc' }, { startsAt: 'asc' }]
    });
    res.json(await applyTranslations('Countdown', countdowns, req.query.lang));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET admin : tous, y compris brouillons et termines
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    res.json(await prisma.countdown.findMany({ orderBy: [{ priority: 'asc' }, { startsAt: 'asc' }] }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const data = readBody(req.body);
    if (!data.title) return res.status(400).json({ error: 'Titre requis' });
    const bad = invalidDates(data.startsAt, data.endsAt);
    if (bad) return res.status(400).json({ error: bad });
    if (req.file) data.image = `/uploads/countdowns/${req.file.filename}`;

    const countdown = await prisma.countdown.create({ data });
    autoTranslate('Countdown', countdown);
    res.status(201).json(countdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const avant = await prisma.countdown.findUnique({ where: { id: req.params.id } });
    if (!avant) return res.status(404).json({ error: 'Compte a rebours introuvable' });

    const data = readBody(req.body);
    const bad = invalidDates(data.startsAt ?? avant.startsAt, data.endsAt ?? avant.endsAt);
    if (bad) return res.status(400).json({ error: bad });
    if (req.file) data.image = `/uploads/countdowns/${req.file.filename}`;
    if (req.body.removeImage === 'true' && !req.file) data.image = null;

    const countdown = await prisma.countdown.update({ where: { id: req.params.id }, data });
    if (avant.image && avant.image !== countdown.image) await deleteUploadedFile(avant.image);

    // Ne retraduit que les champs dont le texte francais a change
    autoTranslate('Countdown', countdown, changedTranslatableFields('Countdown', avant, countdown));
    res.json(countdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const countdown = await prisma.countdown.findUnique({ where: { id: req.params.id } });
    await prisma.countdown.delete({ where: { id: req.params.id } });
    await deleteUploadedFile(countdown?.image);
    res.json({ message: 'Compte a rebours supprime' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Masquer / Afficher sans supprimer
addStatusRoute(router, prisma, 'countdown');

module.exports = router;
