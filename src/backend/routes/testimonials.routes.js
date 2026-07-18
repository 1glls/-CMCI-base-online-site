const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const { applyTranslations, autoTranslate, changedTranslatableFields } = require('../services/translation.service');
const { deleteUploadedFile } = require('../utils/upload-cleanup');

const prisma = new PrismaClient();

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/testimonials');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'testimonial-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

// GET all testimonials (public)
router.get('/', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' }
    });
    // ?lang=en|nl : repli sur le francais quand la traduction manque
    res.json(await applyTranslations('Testimonial', testimonials, req.query.lang));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all testimonials including drafts (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE testimonial (admin)
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, role, quote, status, image: imageUrl } = req.body;
    
    // Support both file upload and URL
    const image = req.file 
      ? `/uploads/testimonials/${req.file.filename}` 
      : (imageUrl || null);

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        role,
        quote,
        image,
        status: status || 'published'
      }
    });

    // Contenu neuf : traduction en arriere-plan, sans bloquer la reponse
    autoTranslate('Testimonial', testimonial);

    res.status(201).json(testimonial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE testimonial (admin)
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { name, role, quote, status, image: imageUrl } = req.body;
    const updateData = { name, role, quote, status };
    
    // Support both file upload and URL
    if (req.file) {
      updateData.image = `/uploads/testimonials/${req.file.filename}`;
    } else if (imageUrl !== undefined) {
      updateData.image = imageUrl;
    }

    // Etat avant mise a jour : sert a ne retraduire que ce qui change
    const avant = await prisma.testimonial.findUnique({ where: { id: req.params.id } });

    const testimonial = await prisma.testimonial.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Ne retraduit que les champs dont le texte francais a change :
    // evite de consommer du quota et d'ecraser des corrections relues.
    autoTranslate('Testimonial', testimonial, changedTranslatableFields('Testimonial', avant, testimonial));

    res.json(testimonial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE testimonial (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const testimonial = await prisma.testimonial.findUnique({
      where: { id: req.params.id }
    });

    await prisma.testimonial.delete({
      where: { id: req.params.id }
    });

    await deleteUploadedFile(testimonial?.image);

    res.json({ message: 'Testimonial deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
