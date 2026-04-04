#!/bin/bash

# Script pour ajouter des événements de test

# Obtenir le répertoire racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/src/backend"

echo "🎯 Adding sample events..."

# Copier les images d'abord
echo "📁 Copie des images d'événements..."
mkdir -p "$BACKEND_DIR/uploads/events"
cp "$PROJECT_ROOT/src/frontend/public/images/event-conference.jpg" "$BACKEND_DIR/uploads/events/" 2>/dev/null
cp "$PROJECT_ROOT/src/frontend/public/images/event-prayer.jpg" "$BACKEND_DIR/uploads/events/" 2>/dev/null
cp "$PROJECT_ROOT/src/frontend/public/images/event-youth.jpg" "$BACKEND_DIR/uploads/events/" 2>/dev/null

cd "$BACKEND_DIR"

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedEvents() {
  const events = [
    {
      title: 'Conference de Reveil 2026',
      date: '15 FEV 2026',
      time: '09:00 - 18:00',
      location: 'Bruxelles, Belgique',
      description: 'Trois jours de revelation, d\'adoration et de transformation spirituelle avec des orateurs internationaux.',
      image: '/uploads/events/event-conference.jpg',
      status: 'published'
    },
    {
      title: 'Nuit de Priere et Louange',
      date: '22 FEV 2026',
      time: '21:00 - 05:00',
      location: 'CMCI Bruxelles',
      description: 'Une nuit consacree a l\'intercession pour la Belgique et les nations. Venez chercher la face de Dieu.',
      image: '/uploads/events/event-prayer.jpg',
      status: 'published'
    },
    {
      title: 'Retraite Jeunesse',
      date: '08 MAR 2026',
      time: 'Tout le weekend',
      location: 'Ardennes, Belgique',
      description: 'Un weekend d\'enseignement, de fellowship et d\'aventure pour la jeunesse. Theme : Generation Radicale.',
      image: '/uploads/events/event-youth.jpg',
      status: 'published'
    },
    {
      title: 'Culte Dominical',
      date: 'Chaque Dimanche',
      time: '10:00 - 13:00',
      location: 'CMCI Bruxelles',
      description: 'Rejoignez-nous chaque dimanche pour un temps d\'adoration, d\'enseignement de la Parole et de communion fraternelle.',
      image: '/uploads/events/event-conference.jpg',
      status: 'published'
    }
  ];

  console.log('Deleting existing events...');
  await prisma.event.deleteMany({});

  console.log('Creating events...');
  for (const event of events) {
    await prisma.event.create({ data: event });
    console.log('✓ Created:', event.title);
  }

  console.log('✅ Events seeded successfully!');
}

seedEvents()
  .catch(console.error)
  .finally(() => prisma.\$disconnect());
"

echo "✅ Sample events added successfully!"
