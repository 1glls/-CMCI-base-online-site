const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authMiddleware, adminMiddleware } = require('../middleware/auth.middleware');
const { sendWelcomeEmail, sendEventNewsletter } = require('../services/email.service');
const { getUpcomingEvents } = require('../services/newsletter-cron.service');

const prisma = new PrismaClient();

// POST - Subscribe to newsletter (public)
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Vérifier si l'email existe déjà
    const existing = await prisma.newsletter.findUnique({
      where: { email }
    });

    if (existing) {
      if (existing.status === 'unsubscribed') {
        // Réactiver l'abonnement
        const updated = await prisma.newsletter.update({
          where: { email },
          data: { status: 'active' }
        });
        return res.json({ message: 'Subscription reactivated', subscriber: updated });
      }
      return res.status(400).json({ error: 'Email already subscribed' });
    }

    // Créer un nouvel abonné
    const subscriber = await prisma.newsletter.create({
      data: { email }
    });

    // Envoyer email de bienvenue
    await sendWelcomeEmail(email);

    res.status(201).json({ message: 'Successfully subscribed', subscriber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Get all subscribers (admin)
router.get('/subscribers', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const subscribers = await prisma.newsletter.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(subscribers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Unsubscribe (admin)
router.delete('/subscribers/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await prisma.newsletter.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Subscriber deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Unsubscribe by email (public)
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    const subscriber = await prisma.newsletter.update({
      where: { email },
      data: { status: 'unsubscribed' }
    });

    res.json({ message: 'Successfully unsubscribed', subscriber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST - Send newsletter manually (admin only)
router.post('/send', authMiddleware, async (req, res) => {
  try {
    const { eventIds, customMessage } = req.body; // IDs des événements à inclure et message personnalisé

    // Récupérer les abonnés actifs
    const subscribers = await prisma.newsletter.findMany({
      where: { status: 'active' }
    });

    if (subscribers.length === 0) {
      return res.status(400).json({ error: 'No active subscribers' });
    }

    // Récupérer les événements
    let events;
    if (eventIds && eventIds.length > 0) {
      events = await prisma.event.findMany({
        where: {
          id: { in: eventIds },
          status: 'published'
        }
      });
    } else {
      // Si pas d'IDs spécifiés, prendre les événements à venir
      events = await getUpcomingEvents();
    }

    if (events.length === 0) {
      return res.status(400).json({ error: 'No events to send' });
    }

    // Envoyer la newsletter avec le message personnalisé
    const result = await sendEventNewsletter(subscribers, events, customMessage);

    res.json({
      message: 'Newsletter sent',
      ...result
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Newsletter statistics (admin only)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const total = await prisma.newsletter.count();
    const active = await prisma.newsletter.count({
      where: { status: 'active' }
    });
    const unsubscribed = await prisma.newsletter.count({
      where: { status: 'unsubscribed' }
    });

    res.json({
      total,
      active,
      unsubscribed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET - Newsletter automation settings (admin only)
router.get('/automation', authMiddleware, async (req, res) => {
  try {
    const settings = await prisma.settings.findMany({
      where: {
        key: {
          in: ['newsletter_auto_enabled', 'newsletter_frequency', 'newsletter_day', 'newsletter_time']
        }
      }
    });
    
    const config = {
      enabled: settings.find(s => s.key === 'newsletter_auto_enabled')?.value === 'true',
      frequency: settings.find(s => s.key === 'newsletter_frequency')?.value || 'weekly',
      day: settings.find(s => s.key === 'newsletter_day')?.value || 'monday',
      time: settings.find(s => s.key === 'newsletter_time')?.value || '09:00'
    };
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update newsletter automation settings (admin only)
router.put('/automation', authMiddleware, async (req, res) => {
  try {
    const { enabled, frequency, day, time } = req.body;
    
    const updates = [
      { key: 'newsletter_auto_enabled', value: String(enabled) },
      { key: 'newsletter_frequency', value: frequency },
      { key: 'newsletter_day', value: day },
      { key: 'newsletter_time', value: time }
    ];
    
    for (const update of updates) {
      await prisma.settings.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: update
      });
    }
    
    res.json({ message: 'Automation settings updated', enabled, frequency, day, time });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
