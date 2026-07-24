const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { applyTranslations, autoTranslate, changedTranslatableFields } =
  require('../services/translation.service');

const prisma = new PrismaClient();

/** Slug stable a partir du libelle : sert au filtrage, jamais traduit. */
function slugify(text) {
  return String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // retire les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

// GET /api/categories — publique, avec le nombre de publications
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { books: true, tracts: true } } }
    });

    // Le libelle suit la langue demandee, le slug reste stable
    const translated = await applyTranslations('Category', categories, req.query.lang);

    res.json(translated.map((c) => ({
      id: c.id, slug: c.slug, name: c.name, order: c.order,
      bookCount: c._count.books, tractCount: c._count.tracts
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, order } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' });

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: slugify(req.body.slug || name),
        order: Number(order) || 0
      }
    });

    autoTranslate('Category', category);
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Cette categorie existe deja' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, order } = req.body;
    const before = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!before) return res.status(404).json({ error: 'Categorie introuvable' });

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (order !== undefined) data.order = Number(order);
    // Le slug n'est jamais regenere : il peut deja servir dans une URL ou un
    // filtre partage.

    const category = await prisma.category.update({ where: { id: req.params.id }, data });
    autoTranslate('Category', category, changedTranslatableFields('Category', before, category));

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Les relations implicites disparaissent avec la categorie : les livres
    // et tracts sont conserves, seul le classement est retire.
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Categorie supprimee' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
