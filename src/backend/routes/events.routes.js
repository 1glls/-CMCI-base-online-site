const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Configuration Multer pour upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/events');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
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

// GET all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'published' },
      orderBy: { createdAt: 'desc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all events including drafts (admin)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single event
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id }
    });
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE event (admin)
router.post('/', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, date, time, location, description, status, registrationUrl, registrationButtonText, exploreButtonText, exploreUrl } = req.body;
    const image = req.file ? `/uploads/events/${req.file.filename}` : null;

    const event = await prisma.event.create({
      data: {
        title,
        date,
        time,
        location,
        description,
        image,
        registrationUrl: registrationUrl || null,
        registrationButtonText: registrationButtonText || null,
        exploreButtonText: exploreButtonText || null,
        exploreUrl: exploreUrl || null,
        status: status || 'published'
      }
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE event (admin)
router.put('/:id', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, date, time, location, description, status, registrationUrl, registrationButtonText, exploreButtonText, exploreUrl } = req.body;
    const updateData = { title, date, time, location, description, status };
    
    // Gérer les champs boutons
    updateData.registrationUrl = registrationUrl || null;
    updateData.registrationButtonText = registrationButtonText || null;
    updateData.exploreButtonText = exploreButtonText || null;
    updateData.exploreUrl = exploreUrl || null;

    if (req.file) {
      updateData.image = `/uploads/events/${req.file.filename}`;
    }

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE event (admin)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.event.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
