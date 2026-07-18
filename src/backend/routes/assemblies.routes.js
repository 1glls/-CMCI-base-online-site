const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth.middleware');
const { applyTranslations, autoTranslate, changedTranslatableFields } = require('../services/translation.service');

const prisma = new PrismaClient();

// GET all published assemblies (public)
router.get('/', async (req, res) => {
  try {
    const assemblies = await prisma.assembly.findMany({
      where: { status: 'published' },
      orderBy: { city: 'asc' }
    });
    // ?lang=en|nl : repli sur le francais quand la traduction manque
    res.json(await applyTranslations('Assembly', assemblies, req.query.lang));
  } catch (error) {
    console.error('Error fetching assemblies:', error);
    res.status(500).json({ error: 'Failed to fetch assemblies' });
  }
});

// GET all assemblies (admin only)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const assemblies = await prisma.assembly.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(assemblies);
  } catch (error) {
    console.error('Error fetching all assemblies:', error);
    res.status(500).json({ error: 'Failed to fetch assemblies' });
  }
});

// GET single assembly
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assembly = await prisma.assembly.findUnique({
      where: { id }
    });

    if (!assembly) {
      return res.status(404).json({ error: 'Assembly not found' });
    }

    res.json(assembly);
  } catch (error) {
    console.error('Error fetching assembly:', error);
    res.status(500).json({ error: 'Failed to fetch assembly' });
  }
});

// POST create assembly (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { city, address, latitude, longitude, schedule, phone, email, status } = req.body;

    // Validation
    if (!city || !address || !schedule || !phone || !email) {
      return res.status(400).json({ 
        error: 'City, address, schedule, phone, and email are required' 
      });
    }

    const assembly = await prisma.assembly.create({
      data: {
        city,
        address,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        schedule,
        phone,
        email,
        status: status || 'published'
      }
    });

    // Contenu neuf : traduction en arriere-plan, sans bloquer la reponse
    autoTranslate('Assembly', assembly);

    res.status(201).json(assembly);
  } catch (error) {
    console.error('Error creating assembly:', error);
    res.status(500).json({ error: 'Failed to create assembly' });
  }
});

// PUT update assembly (admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { city, address, latitude, longitude, schedule, phone, email, status } = req.body;

    const updateData = {};
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (status !== undefined) updateData.status = status;

    // Etat avant mise a jour : sert a ne retraduire que ce qui change
    const avant = await prisma.assembly.findUnique({ where: { id: req.params.id } });

    const assembly = await prisma.assembly.update({
      where: { id },
      data: updateData
    });

    // Ne retraduit que les champs dont le texte francais a change :
    // evite de consommer du quota et d'ecraser des corrections relues.
    autoTranslate('Assembly', assembly, changedTranslatableFields('Assembly', avant, assembly));

    res.json(assembly);
  } catch (error) {
    console.error('Error updating assembly:', error);
    res.status(500).json({ error: 'Failed to update assembly' });
  }
});

// DELETE assembly (admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.assembly.delete({
      where: { id }
    });
    res.json({ message: 'Assembly deleted successfully' });
  } catch (error) {
    console.error('Error deleting assembly:', error);
    res.status(500).json({ error: 'Failed to delete assembly' });
  }
});

module.exports = router;
