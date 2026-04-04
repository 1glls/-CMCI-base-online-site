const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

const prisma = new PrismaClient();

// Configuration Multer pour upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/ministries');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ministry-' + uniqueSuffix + path.extname(file.originalname));
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

// GET all ministries (public)
router.get('/', async (req, res) => {
  try {
    const ministries = await prisma.ministry.findMany({
      where: { status: 'published' },
      orderBy: { order: 'asc' }
    });
    res.json(ministries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all ministries including drafts (admin)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const ministries = await prisma.ministry.findMany({
      orderBy: { order: 'asc' }
    });
    res.json(ministries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single ministry (public)
router.get('/:id', async (req, res) => {
  try {
    const ministry = await prisma.ministry.findUnique({
      where: { id: req.params.id }
    });
    
    if (!ministry) {
      return res.status(404).json({ error: 'Ministry not found' });
    }
    
    res.json(ministry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create ministry (admin)
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, icon, order, status, link } = req.body;
    
    const ministry = await prisma.ministry.create({
      data: {
        title,
        description,
        icon,
        image: req.file ? `/uploads/ministries/${req.file.filename}` : null,
        order: order ? parseInt(order) : 0,
        status: status || 'published',
        link
      }
    });
    
    res.status(201).json(ministry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update ministry (admin)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, icon, order, status, link } = req.body;
    
    const updateData = {
      title,
      description,
      icon,
      order: order ? parseInt(order) : 0,
      status,
      link
    };
    
    if (req.file) {
      updateData.image = `/uploads/ministries/${req.file.filename}`;
    }
    
    const ministry = await prisma.ministry.update({
      where: { id: req.params.id },
      data: updateData
    });
    
    res.json(ministry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE ministry (admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await prisma.ministry.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Ministry deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
