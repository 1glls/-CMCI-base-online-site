const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const { processHeroImage, deleteHeroImages } = require('../utils/image-processor');

const prisma = new PrismaClient();

// Configuration Multer en mémoire pour traitement avec sharp
const storage = multer.memoryStorage();

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

// GET all published hero slides (public)
router.get('/', async (req, res) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      where: { status: 'published' },
      orderBy: { order: 'asc' }
    });

    // Enrichir avec les données des événements liés
    const enrichedSlides = await Promise.all(slides.map(async (slide) => {
      if (slide.eventId) {
        const event = await prisma.event.findUnique({
          where: { id: slide.eventId }
        });
        if (event) {
          return {
            ...slide,
            title: event.title,
            subtitle: event.description.substring(0, 100) + '...',
            // Garder les images traitées du slide (desktop/mobile) si elles existent
            // Sinon fallback vers l'image de l'événement
            image: slide.image || event.image,
            imageMobile: slide.imageMobile || null,
            // Si l'événement a une URL d'inscription et que le slide n'a pas de bouton personnalisé,
            // utiliser le bouton d'inscription de l'événement
            buttonText: slide.buttonText || (event.registrationUrl ? (event.registrationButtonText || "S'inscrire") : null),
            buttonUrl: slide.buttonUrl || event.registrationUrl || null,
            linkedEvent: event
          };
        }
      }
      return slide;
    }));

    res.json(enrichedSlides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all hero slides including drafts (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const slides = await prisma.heroSlide.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single hero slide
router.get('/:id', async (req, res) => {
  try {
    const slide = await prisma.heroSlide.findUnique({
      where: { id: req.params.id }
    });
    
    if (!slide) {
      return res.status(404).json({ error: 'Hero slide not found' });
    }
    
    res.json(slide);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE hero slide (admin)
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, order, status, eventId, buttonText, buttonUrl } = req.body;
    let image = null;
    let imageMobile = null;

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const baseFilename = 'hero-' + uniqueSuffix;

    if (req.file) {
      // Cas 1: Image uploadée directement
      const result = await processHeroImage(req.file.buffer, baseFilename);
      image = result.desktop;
      imageMobile = result.mobile;
    } else if (eventId) {
      // Cas 2: Événement lié → traiter l'image de l'événement
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (event && event.image) {
        try {
          console.log(`🔗 Traitement de l'image de l'événement lié: ${event.image}`);
          const result = await processHeroImage(event.image, baseFilename);
          image = result.desktop;
          imageMobile = result.mobile;
        } catch (imgError) {
          console.error('⚠️ Impossible de traiter l\'image de l\'événement:', imgError.message);
          // Fallback: utiliser l'image de l'événement non traitée
          image = event.image;
        }
      }
    }

    const slide = await prisma.heroSlide.create({
      data: {
        title,
        subtitle,
        image,
        imageMobile,
        eventId: eventId || null,
        buttonText: buttonText || null,
        buttonUrl: buttonUrl || null,
        order: parseInt(order) || 0,
        status: status || 'published'
      }
    });

    res.status(201).json(slide);
  } catch (error) {
    console.error('Erreur création hero slide:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE hero slide (admin)
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, order, status, eventId, buttonText, buttonUrl } = req.body;
    const updateData = { 
      title, 
      subtitle, 
      order: parseInt(order) || 0, 
      status,
      eventId: eventId || null,
      buttonText: buttonText || null,
      buttonUrl: buttonUrl || null
    };

    // Récupérer le slide existant pour comparaison et nettoyage
    const existingSlide = await prisma.heroSlide.findUnique({
      where: { id: req.params.id }
    });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const baseFilename = 'hero-' + uniqueSuffix;
    let needsImageProcessing = false;
    let imageSource = null;

    if (req.file) {
      // Cas 1: Nouvelle image uploadée directement
      needsImageProcessing = true;
      imageSource = req.file.buffer;
    } else if (eventId && eventId !== existingSlide?.eventId) {
      // Cas 2: L'événement lié a changé → traiter la nouvelle image de l'événement
      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (event && event.image) {
        needsImageProcessing = true;
        imageSource = event.image; // Chemin local ou URL
      }
    }

    if (needsImageProcessing && imageSource) {
      // Supprimer les anciennes images
      if (existingSlide) {
        deleteHeroImages(existingSlide.image, existingSlide.imageMobile);
      }

      try {
        const result = await processHeroImage(imageSource, baseFilename);
        updateData.image = result.desktop;
        updateData.imageMobile = result.mobile;
      } catch (imgError) {
        console.error('⚠️ Impossible de traiter l\'image:', imgError.message);
        // Si c'est un événement lié, fallback vers l'image non traitée
        if (eventId && !req.file) {
          const event = await prisma.event.findUnique({ where: { id: eventId } });
          if (event) updateData.image = event.image;
        }
      }
    }

    const slide = await prisma.heroSlide.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(slide);
  } catch (error) {
    console.error('Erreur mise à jour hero slide:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE hero slide (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Récupérer le slide pour supprimer les images associées
    const slide = await prisma.heroSlide.findUnique({
      where: { id: req.params.id }
    });

    if (slide) {
      deleteHeroImages(slide.image, slide.imageMobile);
    }

    await prisma.heroSlide.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Hero slide deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
