#!/bin/bash

# Script pour vérifier les événements dans la base de données

cd "$(dirname "$0")/../../src/backend"

echo "=== Vérification des événements ==="
echo ""

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEvents() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' }
    });
    
    console.log('Total événements:', events.length);
    console.log('');
    
    if (events.length === 0) {
      console.log('Aucun événement trouvé');
    } else {
      events.forEach(event => {
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = eventDate < today;
        
        console.log('ID:', event.id);
        console.log('Titre:', event.title);
        console.log('Date:', event.date);
        console.log('Statut:', event.status);
        console.log('À venir:', !isPast ? 'OUI' : 'NON (passé)');
        console.log('---');
      });
    }
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('Erreur:', error.message);
    await prisma.\$disconnect();
    process.exit(1);
  }
}

checkEvents();
"
