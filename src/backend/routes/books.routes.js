const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { deleteUploadedFile } = require('../utils/upload-cleanup');

const prisma = new PrismaClient();

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DOC_MIMES = ['application/pdf'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const sub = file.fieldname === 'cover' ? 'covers' : 'files';
    const dir = path.join(__dirname, '..', 'uploads', 'books', sub);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `book-${file.fieldname}-${unique}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = file.fieldname === 'cover' ? IMAGE_MIMES : DOC_MIMES;
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error(`Type non autorise pour « ${file.fieldname} » : ${file.mimetype}`));
  }
});

const uploadFields = upload.fields([
  { name: 'cover', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'preview', maxCount: 1 }
]);

const rel = (f) => `/uploads/books/${f.fieldname === 'cover' ? 'covers' : 'files'}/${f.filename}`;

// GET public
router.get('/', async (req, res) => {
  try {
    res.json(await prisma.book.findMany({
      where: { status: 'published' }, orderBy: { order: 'asc' }
    }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    res.json(await prisma.book.findMany({ orderBy: { order: 'asc' } }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, uploadFields, async (req, res) => {
  try {
    const { title, author, description, externalLink, order, status } = req.body;
    if (!title) return res.status(400).json({ error: 'title requis' });

    const book = await prisma.book.create({
      data: {
        title, author: author || null, description: description || '',
        cover: req.files?.cover?.[0] ? rel(req.files.cover[0]) : null,
        file: req.files?.file?.[0] ? rel(req.files.file[0]) : null,
        preview: req.files?.preview?.[0] ? rel(req.files.preview[0]) : null,
        externalLink: externalLink || null,
        order: Number(order) || 0,
        status: status || 'published'
      }
    });
    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, uploadFields, async (req, res) => {
  try {
    const { title, author, description, externalLink, order, status } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (author !== undefined) data.author = author || null;
    if (description !== undefined) data.description = description;
    if (externalLink !== undefined) data.externalLink = externalLink || null;
    if (order !== undefined) data.order = Number(order);
    if (status !== undefined) data.status = status;
    if (req.files?.cover?.[0]) data.cover = rel(req.files.cover[0]);
    if (req.files?.file?.[0]) data.file = rel(req.files.file[0]);
    if (req.files?.preview?.[0]) data.preview = rel(req.files.preview[0]);

    res.json(await prisma.book.update({ where: { id: req.params.id }, data }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const book = await prisma.book.findUnique({ where: { id: req.params.id } });
    if (!book) return res.status(404).json({ error: 'Livre introuvable' });

    await prisma.book.delete({ where: { id: req.params.id } });
    await deleteUploadedFile(book.cover);
    await deleteUploadedFile(book.file);
    await deleteUploadedFile(book.preview);

    res.json({ message: 'Livre supprime' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
