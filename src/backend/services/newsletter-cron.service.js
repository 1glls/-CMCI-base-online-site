/**
 * Envois automatiques de la newsletter (declenches par services/scheduler.service.js
 * selon les reglages de l'admin, page Newsletter → Automatisation).
 *
 * Les dates d'evenements sont du texte libre (« 14 fevrier 2026 ») : elles sont
 * lues avec utils/event-date.js. `new Date(texte)` ne les reconnaissait pas, et
 * aucun evenement n'etait jamais trouve.
 *
 * Chaque fonction renvoie un compte rendu { sent, events, message } affiche
 * dans l'admin. `send` peut etre remplace (tests : aucun e-mail envoye).
 */
const { PrismaClient } = require('@prisma/client');
const { sendEventNewsletter } = require('./email.service');
const { parseEventDate, startOfDay } = require('../utils/event-date');

const prisma = new PrismaClient();
const DAY = 24 * 60 * 60 * 1000;

/** Evenements publies dans les `days` prochains jours (du plus proche au plus lointain). */
async function getUpcomingEvents(days = 30, now = new Date()) {
  const events = await prisma.event.findMany({ where: { status: 'published' } });
  const today = startOfDay(now);
  const until = new Date(today.getTime() + days * DAY);
  return events
    .map((e) => ({ e, d: parseEventDate(e.date) }))
    .filter(({ d }) => d && d >= today && d <= until)
    .sort((a, b) => a.d - b.d)
    .map(({ e }) => e);
}

async function activeSubscribers() {
  return prisma.newsletter.findMany({ where: { status: 'active' } });
}

/** Newsletter periodique : les evenements des 30 prochains jours. */
async function sendPeriodicNewsletter({ now = new Date(), send = sendEventNewsletter } = {}) {
  const subscribers = await activeSubscribers();
  if (subscribers.length === 0) return { sent: 0, events: 0, message: 'Aucun abonné actif : rien envoyé.' };
  const events = await getUpcomingEvents(30, now);
  if (events.length === 0) return { sent: 0, events: 0, message: 'Aucun événement dans les 30 prochains jours : rien envoyé.' };
  const result = await send(subscribers, events);
  if (result && result.success === false) throw new Error(result.error || 'Échec de l\'envoi');
  return {
    sent: result?.sent ?? subscribers.length,
    events: events.length,
    message: `Envoyée à ${result?.sent ?? subscribers.length} abonné(s) pour ${events.length} événement(s).`,
  };
}

/** Rappels : evenements d'aujourd'hui et de demain. */
async function sendEventReminders({ now = new Date(), send = sendEventNewsletter } = {}) {
  const subscribers = await activeSubscribers();
  if (subscribers.length === 0) return { sent: 0, events: 0, message: 'Aucun abonné actif.' };
  const events = await prisma.event.findMany({ where: { status: 'published' } });
  const today = startOfDay(now).getTime();
  const tomorrow = today + DAY;
  const on = (ts) => events.filter((e) => parseEventDate(e.date)?.getTime() === ts);
  const todayEvents = on(today);
  const tomorrowEvents = on(tomorrow);
  let sent = 0;
  if (todayEvents.length) { await send(subscribers, todayEvents); sent++; }
  if (tomorrowEvents.length) { await send(subscribers, tomorrowEvents); sent++; }
  const n = todayEvents.length + tomorrowEvents.length;
  return {
    sent,
    events: n,
    message: n ? `Rappel envoyé pour ${n} événement(s) (aujourd'hui / demain).` : 'Aucun événement aujourd\'hui ni demain.',
  };
}

module.exports = { getUpcomingEvents, sendPeriodicNewsletter, sendEventReminders };
