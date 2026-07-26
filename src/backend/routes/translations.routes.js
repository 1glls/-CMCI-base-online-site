const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const {
  translateRecord, refreshUsage, TRANSLATABLE
} = require('../services/translation.service');

const prisma = new PrismaClient();

/** Ne renvoie jamais une cle en entier : seuls les 4 derniers caracteres. */
function maskProvider(p) {
  const { apiKey, ...rest } = p;
  return {
    ...rest,
    apiKeyMasked: apiKey ? `••••••••${apiKey.slice(-4)}` : null,
    remaining: Math.max(0, p.characterLimit - p.charactersUsed),
    usedPercent: p.characterLimit > 0
      ? Math.min(100, Math.round((p.charactersUsed / p.characterLimit) * 100))
      : 0
  };
}

const MODELS = {
  Event: (id) => prisma.event.findUnique({ where: { id } }),
  Ministry: (id) => prisma.ministry.findUnique({ where: { id } }),
  Assembly: (id) => prisma.assembly.findUnique({ where: { id } }),
  Testimonial: (id) => prisma.testimonial.findUnique({ where: { id } }),
  HeroSlide: (id) => prisma.heroSlide.findUnique({ where: { id } }),
  Category: (id) => prisma.category.findUnique({ where: { id } }),
  Book: (id) => prisma.book.findUnique({ where: { id } }),
  Tract: (id) => prisma.tract.findUnique({ where: { id } })
};

// --- Comptes fournisseurs ---------------------------------------------------

router.get('/providers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const providers = await prisma.translationProvider.findMany({
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }]
    });
    const totals = providers.reduce((acc, p) => ({
      limit: acc.limit + p.characterLimit,
      used: acc.used + p.charactersUsed
    }), { limit: 0, used: 0 });

    res.json({
      providers: providers.map(maskProvider),
      totals: { ...totals, remaining: Math.max(0, totals.limit - totals.used) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/providers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, apiKey, service = 'deepl', characterLimit, priority } = req.body;
    if (!name || !apiKey) {
      return res.status(400).json({ error: 'Nom et cle API requis' });
    }

    const provider = await prisma.translationProvider.create({
      data: {
        name: name.trim(),
        apiKey: apiKey.trim(),
        service,
        characterLimit: Number(characterLimit) || 500000,
        priority: Number(priority) || 0
      }
    });

    // Verification immediate : une cle invalide doit se voir tout de suite,
    // pas au premier contenu a traduire.
    try {
      const checked = await refreshUsage(provider.id);
      return res.status(201).json({ provider: maskProvider(checked), verified: true });
    } catch (e) {
      const failed = await prisma.translationProvider.findUnique({ where: { id: provider.id } });
      return res.status(201).json({
        provider: maskProvider(failed), verified: false, warning: e.message
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/providers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, apiKey, active, characterLimit, priority, exhausted } = req.body;
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (apiKey) data.apiKey = String(apiKey).trim();          // vide = inchangee
    if (active !== undefined) data.active = Boolean(active);
    if (exhausted !== undefined) data.exhausted = Boolean(exhausted);
    if (characterLimit !== undefined) data.characterLimit = Number(characterLimit);
    if (priority !== undefined) data.priority = Number(priority);

    const provider = await prisma.translationProvider.update({
      where: { id: req.params.id }, data
    });
    res.json({ provider: maskProvider(provider) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/providers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.translationProvider.delete({ where: { id: req.params.id } });
    res.json({ message: 'Compte supprime' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Releve la consommation reelle cote fournisseur. */
router.post('/providers/:id/refresh', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const provider = await refreshUsage(req.params.id);
    res.json({ provider: maskProvider(provider) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- Traductions de contenu -------------------------------------------------

/** Traductions existantes d'un enregistrement, toutes langues confondues. */
router.get('/content/:model/:recordId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { model, recordId } = req.params;
    if (!TRANSLATABLE[model]) return res.status(400).json({ error: 'Modele inconnu' });

    const rows = await prisma.contentTranslation.findMany({
      where: { model, recordId }
    });
    const byLang = {};
    for (const r of rows) {
      byLang[r.language] = byLang[r.language] || {};
      byLang[r.language][r.field] = { value: r.value, reviewed: r.reviewed, auto: r.auto };
    }
    res.json({ model, recordId, fields: TRANSLATABLE[model], translations: byLang });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** Declenche la traduction automatique d'un enregistrement. */
router.post('/content/:model/:recordId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { model, recordId } = req.params;
    const languages = Array.isArray(req.body.languages) ? req.body.languages : ['en', 'nl'];

    const loader = MODELS[model];
    if (!loader) return res.status(400).json({ error: 'Modele inconnu' });

    const record = await loader(recordId);
    if (!record) return res.status(404).json({ error: 'Enregistrement introuvable' });

    const results = {};
    for (const lang of languages) {
      results[lang] = await translateRecord(model, recordId, record, lang);
    }
    res.json({ message: 'Traduction effectuee', results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Modeles dont le contenu est redige en admin et doit exister en en/nl.
 * `Book` en est volontairement absent : les livres ztfbooks arrivent deja
 * dans leur langue de publication, on ne traduit pas leur titre.
 */
const BACKFILL = {
  Event: () => prisma.event.findMany(),
  Ministry: () => prisma.ministry.findMany(),
  Assembly: () => prisma.assembly.findMany(),
  Testimonial: () => prisma.testimonial.findMany(),
  HeroSlide: () => prisma.heroSlide.findMany(),
  Category: () => prisma.category.findMany(),
  Tract: () => prisma.tract.findMany()
};
const BACKFILL_LANGS = ['en', 'nl'];

/**
 * Traduit tout ce qui manque, en une passe.
 *
 * Repare les contenus crees par script ou avant le branchement de la
 * traduction (le tract « Le chemin du salut », importe, n'avait aucune
 * traduction). Idempotent : ne touche qu'aux champs sans traduction pour la
 * langue visee — une seconde passe ne consomme rien, et une traduction relue
 * (qui a donc une ligne) n'est jamais reecrite.
 *
 * ?dryRun=1 : estime le cout en caracteres sans appeler DeepL.
 */
router.post('/backfill', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const dryRun = req.query.dryRun === '1' || req.query.dryRun === 'true';
    const summary = {};
    let characters = 0;

    for (const [model, load] of Object.entries(BACKFILL)) {
      const fields = TRANSLATABLE[model] || [];
      const records = await load();
      summary[model] = { records: records.length, translated: 0, filled: 0 };

      for (const record of records) {
        const existing = await prisma.contentTranslation.findMany({
          where: { model, recordId: record.id },
          select: { language: true, field: true }
        });
        const have = new Set(existing.map((e) => `${e.language}.${e.field}`));

        for (const lang of BACKFILL_LANGS) {
          // Champs traduisibles renseignes en francais mais sans ligne pour `lang`
          const missing = fields.filter(
            (f) => record[f] && String(record[f]).trim() && !have.has(`${lang}.${f}`)
          );
          if (missing.length === 0) continue;

          characters += missing.reduce((n, f) => n + String(record[f]).length, 0);

          if (!dryRun) {
            await translateRecord(model, record.id, record, lang, missing);
            summary[model].translated += 1;
          }
          summary[model].filled += missing.length;
        }
      }
    }

    res.json({
      dryRun,
      characters,
      summary,
      message: dryRun
        ? `${characters} caracteres a traduire.`
        : 'Traduction des contenus manquants terminee.'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/** Correction manuelle : marque la traduction comme relue. */
router.put('/content/:model/:recordId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { model, recordId } = req.params;
    const { language, field, value } = req.body;
    if (!TRANSLATABLE[model]?.includes(field)) {
      return res.status(400).json({ error: 'Champ non traduisible' });
    }

    const row = await prisma.contentTranslation.upsert({
      where: { model_recordId_language_field: { model, recordId, language, field } },
      create: { model, recordId, language, field, value, reviewed: true, auto: false },
      update: { value, reviewed: true, auto: false }
    });
    res.json({ translation: row });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
