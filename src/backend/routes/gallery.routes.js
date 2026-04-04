const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Configuration Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/gallery');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
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

// GET all gallery images (public)
router.get('/', async (req, res) => {
  try {
    const images = await prisma.galleryImage.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all gallery images including drafts (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const images = await prisma.galleryImage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE gallery image (admin)
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { alt, category, status, src: srcUrl } = req.body;
    
    // Support both file upload and URL
    const src = req.file 
      ? `/uploads/gallery/${req.file.filename}` 
      : (srcUrl || null);
    
    if (!src) {
      return res.status(400).json({ error: 'Image is required (file or URL)' });
    }

    const image = await prisma.galleryImage.create({
      data: {
        src,
        alt,
        category,
        status: status || 'published'
      }
    });

    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE gallery image (admin)
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { alt, category, status, src: srcUrl } = req.body;
    const updateData = { alt, category, status };
    
    // Support both file upload and URL
    if (req.file) {
      updateData.src = `/uploads/gallery/${req.file.filename}`;
    } else if (srcUrl !== undefined) {
      updateData.src = srcUrl;
    }

    const image = await prisma.galleryImage.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE gallery image (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.galleryImage.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Gallery image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
