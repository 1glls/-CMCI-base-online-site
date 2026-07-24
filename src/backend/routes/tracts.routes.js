const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { deleteUploadedFile, deleteUploadedFiles } = require('../utils/upload-cleanup');
const { generatePreviews } = require('../utils/pdf-preview');
const { applyTranslations, autoTranslate, changedTranslatableFields } = require('../services/translation.service');

const prisma = new PrismaClient();

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DOC_MIMES = ['application/pdf'];

/**
 * Upload multi-champs : couverture (image), PDF, et jusqu'a 4 images
 * d'apercu. Le filtre depend du champ — un PDF dans `cover` doit etre
 * refuse explicitement, pas silencieusement accepte.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = file.fieldname === 'file' ? 'files'
      : file.fieldname === 'previews' ? 'previews' : 'covers';
    const dir = path.join(__dirname, '..', 'uploads', 'tracts', sub);
    fs.mkdirSync(dir, { recursive: true }); // Multer ne cree pas le dossier
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `tract-${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 15 Mo est insuffisant pour un PDF
  fileFilter: (req, file, cb) => {
    const allowed = file.fieldname === 'file' ? DOC_MIMES : IMAGE_MIMES;
    if (allowed.includes(file.mimetype)) return cb(null, true);
    // Error et non chaine : le gestionnaire global renvoie un message utile
    cb(new Error(`Type non autorise pour « ${file.fieldname} » : ${file.mimetype}`));
  }
});

const uploadFields = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'previews', maxCount: 4 }
]);

const rel = (f) => `/uploads/tracts/${
  f.fieldname === 'file' ? 'files' : f.fieldname === 'previews' ? 'previews' : 'covers'
}/${f.filename}`;

/** Les apercus sont stockes en JSON : SQLite n'a pas de type tableau. */
const parsePreviews = (v) => {
  try { return v ? JSON.parse(v) : []; } catch { return []; }
};

const publicVersion = (v) => ({
  id: v.id, language: v.language, label: v.label, dir: v.dir,
  title: v.title, file: v.file, previews: parsePreviews(v.previews)
});


/**
 * Genere les apercus d'une version a partir de son PDF, apres la reponse
 * HTTP : le rendu d'un PDF de 4 Mo prend une a deux secondes et
 * l'administrateur n'a pas a attendre. La version est enregistree tout de
 * suite, les apercus la rejoignent.
 *
 * N'est appele que si aucune image n'a ete fournie a la main : des apercus
 * explicites restent prioritaires.
 */
function autoPreviews(versionId, webFilePath) {
  if (!webFilePath) return;

  setImmediate(async () => {
    try {
      const abs = path.join(__dirname, '..', webFilePath.replace(/^\//, ''));
      const outDir = path.join(__dirname, '..', 'uploads', 'tracts', 'previews');

      const previews = await generatePreviews(abs, outDir, {
        prefix: 'tract-previews',
        webBase: '/uploads/tracts/previews'
      });
      if (previews.length === 0) return;

      await prisma.tractVersion.update({
        where: { id: versionId },
        data: { previews: JSON.stringify(previews) }
      });
      console.log(`Apercus generes (${previews.length}) pour la version ${versionId}`);
    } catch (error) {
      console.error('Apercus automatiques :', error.message);
    }
  });
}


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

// --- Public -----------------------------------------------------------------

// GET /api/tracts — liste publique
router.get('/', async (req, res) => {
  try {
    const tracts = await prisma.tract.findMany({
      where: { status: 'published' },
      orderBy: { order: 'asc' },
      include: {
        versions: { where: { status: 'published', reviewed: true } },
        categories: { select: { id: true, slug: true, name: true } }
      }
    });

    const translated = await applyTranslations('Tract', tracts, req.query.lang);
    res.json(translated.map((t) => ({
      id: t.id, slug: t.slug, title: t.title, description: t.description,
      cover: t.cover, featured: t.featured, languageCount: t.versions.length,
      categories: t.categories
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/tracts/slug/:slug — cible du QR-code.
 * Une seule requete renvoie tout ce dont la page a besoin, ce qui compte
 * sur une connexion mobile. Ne renvoie que les versions relues ET publiees.
 */
router.get('/slug/:slug', async (req, res) => {
  try {
    const tract = await prisma.tract.findUnique({
      where: { slug: req.params.slug },
      include: {
        versions: {
          where: { status: 'published', reviewed: true },
          orderBy: { label: 'asc' }
        }
      }
    });

    if (!tract || tract.status !== 'published') {
      return res.status(404).json({ error: 'Tract introuvable' });
    }

    res.json({
      id: tract.id, slug: tract.slug, title: tract.title,
      description: tract.description, cover: tract.cover,
      versions: tract.versions.map(publicVersion)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Admin ------------------------------------------------------------------

router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tracts = await prisma.tract.findMany({
      orderBy: { order: 'asc' },
      include: { versions: { orderBy: { label: 'asc' } }, categories: true }
    });
    res.json(tracts.map((t) => ({
      ...t,
      versions: t.versions.map((v) => ({ ...v, previews: parsePreviews(v.previews) }))
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, uploadFields, async (req, res) => {
  try {
    const { slug, title, description, order, status, featured, categoryIds } = req.body;
    if (!slug || !title) return res.status(400).json({ error: 'slug et title requis' });

    const tract = await prisma.tract.create({
      data: {
        slug: slug.trim().toLowerCase(),
        title, description: description || '',
        cover: req.files?.cover?.[0] ? rel(req.files.cover[0]) : null,
        order: Number(order) || 0,
        featured: featured === undefined ? true : (featured === 'true' || featured === true),
        status: status || 'published',
        ...connectCategories(categoryIds)
      }
    });
    autoTranslate('Tract', tract);
    res.status(201).json(tract);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Ce slug est deja utilise' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, uploadFields, async (req, res) => {
  try {
    const { title, description, order, status, featured, categoryIds } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (order !== undefined) data.order = Number(order);
    if (status !== undefined) data.status = status;
    if (featured !== undefined) data.featured = featured === 'true' || featured === true;
    if (req.files?.cover?.[0]) data.cover = rel(req.files.cover[0]);
    // `set` remplace l'ensemble : c'est ce qu'attend une liste de cases cochees
    if (categoryIds !== undefined) Object.assign(data, setCategories(categoryIds));

    res.json(await prisma.tract.update({
      where: { id: req.params.id }, data, include: { categories: true }
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const tract = await prisma.tract.findUnique({
      where: { id: req.params.id }, include: { versions: true }
    });
    if (!tract) return res.status(404).json({ error: 'Tract introuvable' });

    await prisma.tract.delete({ where: { id: req.params.id } });

    // onDelete: Cascade supprime les lignes, jamais les fichiers.
    await deleteUploadedFile(tract.cover);
    for (const v of tract.versions) {
      await deleteUploadedFile(v.file);
      await deleteUploadedFiles(parsePreviews(v.previews));
    }
    res.json({ message: 'Tract supprime' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Versions linguistiques -------------------------------------------------

router.post('/:id/versions', authMiddleware, adminMiddleware, uploadFields, async (req, res) => {
  try {
    const { language, label, title, dir, reviewed, status } = req.body;
    if (!language || !label) {
      return res.status(400).json({ error: 'language et label requis' });
    }

    const version = await prisma.tractVersion.create({
      data: {
        tractId: req.params.id,
        language: language.trim().toLowerCase(),
        label: label.trim(),
        title: title || label,
        dir: dir === 'rtl' ? 'rtl' : 'ltr',
        file: req.files?.file?.[0] ? rel(req.files.file[0]) : null,
        previews: req.files?.previews?.length
          ? JSON.stringify(req.files.previews.map(rel)) : null,
        reviewed: reviewed === 'true' || reviewed === true,
        status: status || 'draft'
      }
    });
    // Aucun apercu fourni : on les fabrique depuis le PDF
    if (!req.files?.previews?.length) autoPreviews(version.id, version.file);

    res.status(201).json({ ...version, previews: parsePreviews(version.previews) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Cette langue existe deja pour ce tract' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/versions/:versionId', authMiddleware, adminMiddleware, uploadFields, async (req, res) => {
  try {
    const { label, title, dir, reviewed, status } = req.body;
    const data = {};
    if (label !== undefined) data.label = label;
    if (title !== undefined) data.title = title;
    if (dir !== undefined) data.dir = dir === 'rtl' ? 'rtl' : 'ltr';
    if (reviewed !== undefined) data.reviewed = reviewed === 'true' || reviewed === true;
    if (status !== undefined) data.status = status;
    if (req.files?.file?.[0]) data.file = rel(req.files.file[0]);
    if (req.files?.previews?.length) {
      data.previews = JSON.stringify(req.files.previews.map(rel));
    }

    const version = await prisma.tractVersion.update({
      where: { id: req.params.versionId }, data
    });

    // Nouveau PDF sans apercus fournis : on les regenere
    if (req.files?.file?.[0] && !req.files?.previews?.length) {
      autoPreviews(version.id, version.file);
    }

    res.json({ ...version, previews: parsePreviews(version.previews) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/versions/:versionId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const version = await prisma.tractVersion.findUnique({
      where: { id: req.params.versionId }
    });
    if (!version) return res.status(404).json({ error: 'Version introuvable' });

    await prisma.tractVersion.delete({ where: { id: req.params.versionId } });
    await deleteUploadedFile(version.file);
    await deleteUploadedFiles(parsePreviews(version.previews));

    res.json({ message: 'Version supprimee' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
