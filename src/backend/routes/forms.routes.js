const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { initializeSheet, appendSubmission, isGoogleSheetsConfigured } = require('../services/google-sheets.service');

const prisma = new PrismaClient();

// =============================
// ROUTES PUBLIQUES
// =============================

// GET form by slug (public)
router.get('/public/:slug', async (req, res) => {
  try {
    const form = await prisma.form.findUnique({
      where: { slug: req.params.slug }
    });

    if (!form || form.status !== 'published') {
      return res.status(404).json({ error: 'Formulaire introuvable ou fermé' });
    }

    // Retourner les infos publiques (pas le googleSheetId)
    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      slug: form.slug,
      fields: JSON.parse(form.fields),
      status: form.status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST submit form (public)
router.post('/public/:slug/submit', async (req, res) => {
  try {
    const form = await prisma.form.findUnique({
      where: { slug: req.params.slug }
    });

    if (!form || form.status !== 'published') {
      return res.status(404).json({ error: 'Formulaire introuvable ou fermé' });
    }

    const fields = JSON.parse(form.fields);
    const { data } = req.body;

    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Validation des champs obligatoires
    for (const field of fields) {
      if (field.required) {
        const value = data[field.id];
        if (value === undefined || value === null || value === '' || 
            (Array.isArray(value) && value.length === 0)) {
          return res.status(400).json({ 
            error: `Le champ "${field.label}" est obligatoire` 
          });
        }
      }
    }

    // 1. Sauvegarder dans la base de données
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        data: JSON.stringify(data)
      }
    });

    // 2. Incrémenter le compteur
    await prisma.form.update({
      where: { id: form.id },
      data: { submitCount: { increment: 1 } }
    });

    // 3. Envoyer au Google Sheet (en arrière-plan, sans bloquer la réponse)
    if (form.googleSheetId) {
      appendSubmission(form.googleSheetId, fields, data).catch(err => {
        console.error('⚠️ Erreur Google Sheets (non-bloquante):', err.message);
      });
    }

    res.status(201).json({ 
      success: true, 
      message: 'Merci ! Votre réponse a été enregistrée.',
      submissionId: submission.id 
    });
  } catch (error) {
    console.error('Erreur soumission formulaire:', error);
    res.status(500).json({ error: error.message });
  }
});

// =============================
// ROUTES ADMIN
// =============================

// GET Google Sheets status (must be before /:id)
router.get('/config/google-sheets-status', authMiddleware, adminMiddleware, async (req, res) => {
  res.json({ configured: isGoogleSheetsConfigured() });
});

// GET all forms (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const forms = await prisma.form.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { submissions: true } } }
    });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single form with submissions (admin)
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const form = await prisma.form.findUnique({
      where: { id: req.params.id },
      include: { 
        submissions: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Formulaire introuvable' });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET submissions for a form (admin)
router.get('/:id/submissions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const submissions = await prisma.formSubmission.findMany({
      where: { formId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE form (admin)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, fields, googleSheetId, googleSheetUrl, status } = req.body;
    let { slug } = req.body;

    if (!title || !fields || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Titre et champs sont obligatoires' });
    }

    // Auto-generate slug from title if not provided
    if (!slug) {
      slug = title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    }

    // Vérifier l'unicité du slug
    const existing = await prisma.form.findUnique({ where: { slug } });
    if (existing) {
      return res.status(400).json({ error: 'Ce slug est déjà utilisé' });
    }

    const form = await prisma.form.create({
      data: {
        title,
        description: description || null,
        slug,
        fields: JSON.stringify(fields),
        googleSheetId: googleSheetId || null,
        googleSheetUrl: googleSheetUrl || null,
        status: status || 'published'
      }
    });

    // Initialiser le Google Sheet si configuré
    if (googleSheetId && isGoogleSheetsConfigured()) {
      initializeSheet(googleSheetId, fields).catch(err => {
        console.error('⚠️ Erreur init Google Sheet:', err.message);
      });
    }

    res.status(201).json(form);
  } catch (error) {
    console.error('Erreur création formulaire:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE form (admin)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, slug, fields, googleSheetId, googleSheetUrl, status } = req.body;

    // Vérifier l'unicité du slug (sauf pour ce formulaire)
    if (slug) {
      const existing = await prisma.form.findFirst({ 
        where: { slug, NOT: { id: req.params.id } } 
      });
      if (existing) {
        return res.status(400).json({ error: 'Ce slug est déjà utilisé' });
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description || null;
    if (slug !== undefined) updateData.slug = slug;
    if (fields !== undefined) updateData.fields = JSON.stringify(fields);
    if (googleSheetId !== undefined) updateData.googleSheetId = googleSheetId || null;
    if (googleSheetUrl !== undefined) updateData.googleSheetUrl = googleSheetUrl || null;
    if (status !== undefined) updateData.status = status;

    const form = await prisma.form.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Re-initialiser le Google Sheet si les champs ont changé
    if (fields && googleSheetId && isGoogleSheetsConfigured()) {
      initializeSheet(googleSheetId, fields).catch(err => {
        console.error('⚠️ Erreur re-init Google Sheet:', err.message);
      });
    }

    res.json(form);
  } catch (error) {
    console.error('Erreur mise à jour formulaire:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE form (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.form.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Formulaire supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE single submission (admin)
router.delete('/submissions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.formSubmission.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Soumission supprimée' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
