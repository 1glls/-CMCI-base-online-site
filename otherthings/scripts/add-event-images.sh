#!/bin/bash

# Script pour associer des images aux événements existants

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/src/backend"
FRONTEND_DIR="$PROJECT_ROOT/src/frontend"

echo "🖼️  Association d'images aux événements..."

# Créer le dossier uploads/events s'il n'existe pas
mkdir -p "$BACKEND_DIR/uploads/events"

# Copier les images depuis le frontend vers le backend
echo "📁 Copie des images..."
cp "$FRONTEND_DIR/public/images/event-conference.jpg" "$BACKEND_DIR/uploads/events/event-conference.jpg" 2>/dev/null
cp "$FRONTEND_DIR/public/images/event-prayer.jpg" "$BACKEND_DIR/uploads/events/event-prayer.jpg" 2>/dev/null
cp "$FRONTEND_DIR/public/images/event-youth.jpg" "$BACKEND_DIR/uploads/events/event-youth.jpg" 2>/dev/null

echo "✅ Images copiées dans uploads/events/"

# Mettre à jour la base de données
cd "$BACKEND_DIR"

echo "🔄 Mise à jour de la base de données..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEventImages() {
  try {
    // Mapping événements -> images
    const imageMapping = {
      'Conference de Reveil 2026': '/uploads/events/event-conference.jpg',
      'Nuit de Priere et Louange': '/uploads/events/event-prayer.jpg',
      'Retraite Jeunesse': '/uploads/events/event-youth.jpg',
      'Culte Dominical': '/uploads/events/event-conference.jpg' // Image par défaut
    };

    console.log('Recherche des événements...');
    const events = await prisma.event.findMany();
    
    for (const event of events) {
      const imagePath = imageMapping[event.title];
      if (imagePath) {
        await prisma.event.update({
          where: { id: event.id },
          data: { image: imagePath }
        });
        console.log(\`✓ Image associée: \${event.title} -> \${imagePath}\`);
      }
    }

    console.log('✅ Mise à jour terminée !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

updateEventImages();
"

echo ""
echo "✨ Terminé ! Les événements ont maintenant des images associées."
echo "   Rafraîchissez la page d'accueil pour voir les changements."
