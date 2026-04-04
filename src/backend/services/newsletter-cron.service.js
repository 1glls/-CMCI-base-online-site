const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendEventNewsletter } = require('../services/email.service');

const prisma = new PrismaClient();

// Fonction pour obtenir les événements à venir (dans les 30 prochains jours)
const getUpcomingEvents = async () => {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: 'published'
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Filtrer les événements dans les 30 prochains jours
    const today = new Date();
    const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= in30Days;
    });
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    return [];
  }
};

// Fonction pour envoyer la newsletter hebdomadaire
const sendWeeklyNewsletter = async () => {
  try {
    console.log('📧 Démarrage envoi newsletter hebdomadaire...');

    // Récupérer les abonnés actifs
    const subscribers = await prisma.newsletter.findMany({
      where: {
        status: 'active'
      }
    });

    if (subscribers.length === 0) {
      console.log('Aucun abonné actif trouvé');
      return;
    }

    // Récupérer les événements à venir
    const upcomingEvents = await getUpcomingEvents();

    if (upcomingEvents.length === 0) {
      console.log('Aucun événement à venir dans les 30 prochains jours');
      return;
    }

    console.log(`Envoi à ${subscribers.length} abonnés pour ${upcomingEvents.length} événements`);

    // Envoyer la newsletter
    const result = await sendEventNewsletter(subscribers, upcomingEvents);

    if (result.success) {
      console.log(`✅ Newsletter envoyée: ${result.sent} succès, ${result.failed} échecs`);
    } else {
      console.error('❌ Erreur envoi newsletter:', result.error);
    }
  } catch (error) {
    console.error('Erreur tâche planifiée newsletter:', error);
  }
};

// Configurer les tâches planifiées
const setupCronJobs = () => {
  // Newsletter hebdomadaire - Chaque lundi à 9h
  cron.schedule('0 9 * * 1', sendWeeklyNewsletter, {
    timezone: 'Europe/Brussels'
  });
  console.log('✅ Tâche planifiée configurée: Newsletter hebdomadaire (Lundi 9h)');

  // Newsletter avant événement - Chaque jour à 8h
  cron.schedule('0 8 * * *', async () => {
    try {
      console.log('📧 Vérification événements du jour...');

      const subscribers = await prisma.newsletter.findMany({
        where: { status: 'active' }
      });

      if (subscribers.length === 0) return;

      // Récupérer les événements d'aujourd'hui et de demain
      const events = await prisma.event.findMany({
        where: {
          status: 'published'
        }
      });

      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const todayEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === today.toDateString();
      });

      const tomorrowEvents = events.filter(e => {
        const eventDate = new Date(e.date);
        return eventDate.toDateString() === tomorrow.toDateString();
      });

      // Envoyer rappel pour événements du jour
      if (todayEvents.length > 0) {
        await sendEventNewsletter(subscribers, todayEvents);
        console.log(`✅ Rappel envoyé pour ${todayEvents.length} événement(s) aujourd'hui`);
      }

      // Envoyer rappel pour événements de demain
      if (tomorrowEvents.length > 0) {
        await sendEventNewsletter(subscribers, tomorrowEvents);
        console.log(`✅ Rappel envoyé pour ${tomorrowEvents.length} événement(s) demain`);
      }
    } catch (error) {
      console.error('Erreur rappel événements:', error);
    }
  }, {
    timezone: 'Europe/Brussels'
  });
  console.log('✅ Tâche planifiée configurée: Rappel événements quotidien (8h)');
};

module.exports = {
  setupCronJobs,
  sendWeeklyNewsletter,
  getUpcomingEvents
};
