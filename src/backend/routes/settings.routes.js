const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const scheduler = require('../services/scheduler.service');
const { resetTranslationModeCache } = require('../services/translation.service');

const prisma = new PrismaClient();
const admin = [authMiddleware, adminMiddleware];

/**
 * Valeurs autorisees pour les reglages « Rythmes et automatismes ».
 * Une valeur hors bornes est refusee (le site retomberait sinon sur le defaut
 * sans que l'administrateur comprenne pourquoi).
 */
const range = (min, max, label) => (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? null : `${label} : valeur entre ${min} et ${max} attendue.`;
};
const oneOf = (values, label) => (v) => (values.includes(String(v)) ? null : `${label} : valeur non autorisée.`);
const VALIDATORS = {
  social_sync_hours: oneOf(['0', '1', '3', '6', '12', '24'], 'Synchronisation des réseaux'),
  social_hero_count: range(0, 6, 'Publications dans le haut de l\'accueil'),
  translation_mode: oneOf(['immediate', 'scheduled', 'manual'], 'Mode de traduction'),
  translation_interval_hours: oneOf(['1', '6', '12', '24'], 'Intervalle de traduction'),
  newsletter_reminders: oneOf(['true', 'false'], 'Rappels d\'événements'),
  links_check_mode: oneOf(['auto', 'manual'], 'Contrôle des liens'),
  links_check_interval_hours: oneOf(['24', '72', '168', '720'], 'Fréquence du contrôle des liens'),
  links_alert_email: (v) => (String(v).split(/[,;\s]+/).filter(Boolean).every((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
    ? null : 'Email d\'alerte des liens : adresse invalide.'),
};
const validate = (key, value) => {
  if (key.startsWith('timing_')) return range(3, 30, 'Durée')(value);
  if (key.startsWith('job_')) return 'Réglage interne : non modifiable.';
  return VALIDATORS[key] ? VALIDATORS[key](value) : null;
};

// GET settings (public : coordonnees, reseaux, durees… mais pas l'etat interne des taches)
router.get('/', async (req, res) => {
  try {
    // Adresse d'alerte : jamais publique (lue par l'admin via /api/links/config).
    const settings = await prisma.settings.findMany({
      where: { AND: [{ NOT: { key: { startsWith: 'job_' } } }, { NOT: { key: 'links_alert_email' } }] },
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Etat des taches automatiques (admin)
router.get('/jobs', ...admin, async (req, res) => {
  try {
    res.json(await scheduler.jobsStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lancer une tache tout de suite (admin)
router.post('/jobs/:key/run', ...admin, async (req, res) => {
  try {
    if (!scheduler.JOBS[req.params.key]) return res.status(404).json({ error: 'Tâche inconnue' });
    // Controle des liens : trop long pour une requete HTTP, lance en arriere-plan.
    if (req.params.key === 'links') return res.status(202).json(scheduler.startJob('links'));
    res.json(await scheduler.runJob(req.params.key));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Plusieurs reglages d'un coup (admin) : { valeurs: { cle: valeur } }
router.put('/', ...admin, async (req, res) => {
  try {
    const values = req.body?.values || {};
    const errors = Object.entries(values).map(([k, v]) => validate(k, v)).filter(Boolean);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });
    for (const [key, value] of Object.entries(values)) {
      await prisma.settings.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } });
    }
    if ('translation_mode' in values) resetTranslationModeCache();
    res.json({ ok: true, saved: Object.keys(values).length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE setting (admin)
router.put('/:key', ...admin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const error = validate(key, value);
    if (error) return res.status(400).json({ error });

    const setting = await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
    if (key === 'translation_mode') resetTranslationModeCache();

    res.json(setting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
