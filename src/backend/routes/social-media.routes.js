const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const social = require('../services/social-media.service');
const { deleteUploadedFile } = require('../utils/upload-cleanup');

const prisma = new PrismaClient();
const admin = [authMiddleware, adminMiddleware];

const POST_STATUSES = ['pending', 'approved', 'rejected', 'hidden'];

/* ---------------------------------- public ---------------------------------- */

// Publications approuvees, affichees dans « A la une » de l'accueil : toutes,
// du plus recent au plus ancien. Pour en retirer une, l'admin la masque.
// PER_PLATFORM n'est qu'un garde-fou contre une liste demesuree.
const PER_PLATFORM = 50;
router.get('/', async (req, res) => {
  try {
    const lists = await Promise.all(social.PLATFORMS.map((platform) =>
      prisma.socialMediaPost.findMany({
        where: { status: 'approved', platform },
        orderBy: { publishedAt: 'desc' },
        take: PER_PLATFORM,
      })));
    const posts = lists.flat().sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0));
    res.json(posts.map((p) => ({
      id: p.id,
      platform: p.platform,
      title: p.title,
      content: p.content,
      mediaUrl: p.mediaUrl,
      // la copie locale n'expire pas ; le lien d'origine sert de secours
      thumbnail: p.localThumbnail || p.thumbnailUrl,
      author: p.author,
      publishedAt: p.publishedAt,
      isVideo: p.isVideo,
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* --------------------------------- comptes -------------------------------- */

const mask = (v) => (v ? `••••••••${String(v).slice(-4)}` : null);

/** Etat des comptes, sans jamais renvoyer un secret en entier. */
router.get('/accounts', ...admin, async (req, res) => {
  try {
    const accounts = [];
    for (const platform of social.PLATFORMS) {
      const { account, creds, sources } = await social.credentialsFor(platform);
      const fields = social.FIELDS[platform].map((f) => ({
        key: f.key,
        label: f.label,
        secret: !!f.secret,
        required: !!f.required,
        source: sources[f.key], // 'admin' | 'env' | 'facebook' | null
        value: f.secret ? null : creds[f.key] || '',
        masked: f.secret ? mask(creds[f.key]) : null,
      }));
      const configured = social.FIELDS[platform].every((f) => !f.required || creds[f.key])
        && (platform !== 'instagram' || !!creds.accessToken);
      accounts.push({
        platform,
        name: social.NAMES[platform],
        enabled: account?.enabled ?? true,
        autoApprove: account?.autoApprove ?? false,
        accountName: account?.accountName ?? null,
        lastSyncAt: account?.lastSyncAt ?? null,
        lastCount: account?.lastCount ?? null,
        lastError: account?.lastError ?? null,
        configured,
        fields,
      });
    }
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Mise a jour d'un compte. Un champ secret laisse vide n'est pas modifie ;
 * `clear: ['champ']` l'efface explicitement.
 */
router.put('/accounts/:platform', ...admin, async (req, res) => {
  const { platform } = req.params;
  if (!social.PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Réseau inconnu' });
  try {
    const { credentials = {}, clear = [], enabled, autoApprove } = req.body || {};
    const account = await social.getAccount(platform);
    const saved = social.parseCredentials(account?.credentials);
    for (const f of social.FIELDS[platform]) {
      const v = credentials[f.key];
      if (typeof v === 'string' && v.trim() !== '') saved[f.key] = v.trim();
      else if (!f.secret && typeof v === 'string') saved[f.key] = '';
      if (clear.includes(f.key)) delete saved[f.key];
    }
    const data = { credentials: JSON.stringify(saved) };
    if (typeof enabled === 'boolean') data.enabled = enabled;
    if (typeof autoApprove === 'boolean') data.autoApprove = autoApprove;
    // De nouveaux identifiants invalident le dernier diagnostic
    if (Object.keys(credentials).length || clear.length) data.lastError = null;
    await social.saveAccount(platform, data);
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Teste la connexion d'un reseau (aucune publication enregistree)
router.post('/accounts/:platform/test', ...admin, async (req, res) => {
  const { platform } = req.params;
  if (!social.PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Réseau inconnu' });
  res.json(await social.testPlatform(platform));
});

/* ------------------------------ connexion TikTok ----------------------------- */

const backendUrl = (req) => (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
const tiktokRedirect = (req) => `${backendUrl(req)}/api/social-media/tiktok/callback`;

// Renvoie l'adresse d'autorisation TikTok (l'admin y est redirige)
router.get('/tiktok/connect', ...admin, async (req, res) => {
  try {
    const state = jwt.sign({ purpose: 'tiktok', userId: req.userId }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.json({ url: await social.tiktokAuthorizeUrl(tiktokRedirect(req), state), redirectUri: tiktokRedirect(req) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Retour de TikTok apres autorisation : echange du code contre les jetons
router.get('/tiktok/callback', async (req, res) => {
  const front = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  const back = (status, message) =>
    res.redirect(`${front}/admin/social-media?tiktok=${status}${message ? `&message=${encodeURIComponent(message)}` : ''}`);
  try {
    const { code, state, error, error_description } = req.query;
    if (error) return back('erreur', error_description || String(error));
    const payload = jwt.verify(String(state || ''), process.env.JWT_SECRET);
    if (payload.purpose !== 'tiktok') throw new Error('state');
    await social.tiktokExchangeCode(String(code), tiktokRedirect(req));
    return back('ok');
  } catch (e) {
    return back('erreur', e.message === 'state' || e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError'
      ? 'Lien de connexion expiré : recommencez depuis l\'admin.'
      : e.message);
  }
});

/* -------------------------------- publications ------------------------------- */

router.get('/all', ...admin, async (req, res) => {
  try {
    const { status, platform } = req.query;
    const where = {};
    if (status) where.status = status;
    if (platform) where.platform = platform;
    const posts = await prisma.socialMediaPost.findMany({ where, orderBy: { publishedAt: 'desc' } });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Synchronise tous les reseaux : resume par reseau ({ ok, nouveaux, error… })
router.post('/sync-all', ...admin, async (req, res) => {
  try {
    res.json({ results: await social.syncAll() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Synchronise un seul reseau
router.post('/fetch/:platform', ...admin, async (req, res) => {
  const { platform } = req.params;
  if (!social.PLATFORMS.includes(platform)) return res.status(400).json({ error: 'Réseau inconnu' });
  res.json(await social.syncPlatform(platform));
});

// Publier / refuser / masquer / remettre en attente
router.put('/:id/validate', ...admin, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!POST_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Statut invalide (attendu : ${POST_STATUSES.join(', ')})` });
    }
    const post = await prisma.socialMediaPost.update({
      where: { id: req.params.id },
      data: { status, validatedBy: req.userId, validatedAt: new Date() },
    });
    res.json(post);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Publication introuvable' });
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', ...admin, async (req, res) => {
  try {
    const post = await prisma.socialMediaPost.delete({ where: { id: req.params.id } });
    if (post.localThumbnail) await deleteUploadedFile(post.localThumbnail);
    res.json({ message: 'Publication supprimée' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Publication introuvable' });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
