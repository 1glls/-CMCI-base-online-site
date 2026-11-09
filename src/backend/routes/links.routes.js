/**
 * Controle des liens (admin uniquement) — page admin « Contrôle des liens ».
 * Le travail est fait par services/link-checker.service.js ; le controle
 * complet passe par le planificateur (tache `links`) pour partager son verrou
 * « deja en cours » et son compte rendu.
 */
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const checker = require('../services/link-checker.service');
const scheduler = require('../services/scheduler.service');

const router = express.Router();
const prisma = new PrismaClient();
router.use(authMiddleware, adminMiddleware);

const STATE_ORDER = { broken: 0, warning: 1, pending: 2, ok: 3 };

// GET /api/links?state=broken|warning|ok|pending|ignored&kind=external|file|page
router.get('/', async (req, res) => {
  try {
    const { state, kind } = req.query;
    const where = {};
    if (state === 'ignored') where.ignored = true;
    else if (state) { where.state = String(state); where.ignored = false; }
    if (kind) where.kind = String(kind);
    const rows = await prisma.linkCheck.findMany({ where, take: 5000 });
    rows.sort((a, b) => (STATE_ORDER[a.state] ?? 9) - (STATE_ORDER[b.state] ?? 9) || String(a.label).localeCompare(String(b.label), 'fr'));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/links/summary : compteurs + etat de la tache planifiee
router.get('/summary', async (req, res) => {
  try {
    const [counts, jobs] = await Promise.all([checker.summary(), scheduler.jobsStatus()]);
    res.json({ ...counts, job: jobs.find((j) => j.key === 'links') || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/links/config : reglages du controle (y compris l'email, non public)
router.get('/config', async (req, res) => {
  try {
    const s = await scheduler.readSettings();
    res.json({
      mode: s.links_check_mode,
      intervalHours: s.links_check_interval_hours,
      alertEmail: s.links_alert_email || '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/links/run : controle complet tout de suite
router.post('/run', async (req, res) => {
  try {
    res.json(await scheduler.runJob('links'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/links/recheck { ids } : retester une selection (sans email)
router.post('/recheck', async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(String).slice(0, 500) : [];
    if (ids.length === 0) return res.status(400).json({ error: 'Aucun lien sélectionné.' });
    const r = await checker.runLinkCheck({ ids });
    const rows = await prisma.linkCheck.findMany({ where: { id: { in: ids } } });
    res.json({ ok: true, checked: r.checked, rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/links/:id { ignored } : ignorer un faux positif (ou le reprendre)
router.patch('/:id', async (req, res) => {
  try {
    const row = await prisma.linkCheck.update({
      where: { id: req.params.id },
      data: { ignored: !!req.body?.ignored },
    });
    res.json(row);
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ error: 'Lien introuvable' });
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
