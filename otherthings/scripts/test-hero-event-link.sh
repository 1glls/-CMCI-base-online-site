#!/bin/bash

# Script pour tester la liaison d'un événement à une slide hero

BASE_DIR="/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website"
BACKEND_DIR="${BASE_DIR}/src/backend"

echo "=== Test: Lier un événement à une slide hero ==="

cd "${BACKEND_DIR}"

# Récupérer le premier événement
echo -e "\n📋 Récupération d'un événement..."
EVENT_ID=$(node <<'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getFirstEvent() {
  try {
    const event = await prisma.event.findFirst();
    if (event) {
      console.log(event.id);
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getFirstEvent();
EOF
)

if [ -z "$EVENT_ID" ]; then
  echo "❌ Aucun événement trouvé"
  exit 1
fi

echo "✅ Événement trouvé: $EVENT_ID"

# Créer une slide liée à cet événement
echo -e "\n📝 Création d'une slide hero liée à l'événement..."
EVENT_ID="$EVENT_ID" node <<'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const eventId = process.env.EVENT_ID;

async function createLinkedSlide() {
  try {
    const slide = await prisma.heroSlide.create({
      data: {
        title: "Événement à venir",
        subtitle: "Rejoignez-nous pour cet événement spécial",
        image: null,
        eventId: eventId,
        order: 4,
        status: "published"
      }
    });
    console.log('✅ Slide créée:', slide.title);
    console.log('   Liée à l\'événement:', slide.eventId);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createLinkedSlide();
EOF

echo -e "\n🧪 Test de l'API /api/hero..."
curl -s http://localhost:5000/api/hero | node -e "
  const data = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
  const linkedSlides = data.filter(s => s.eventId);
  console.log('\n📊 Slides avec événement lié:', linkedSlides.length);
  linkedSlides.forEach(s => {
    console.log('   - ' + s.title);
    console.log('     Event ID:', s.eventId);
    console.log('     LinkedEvent:', s.linkedEvent ? '✅ Présent' : '❌ Absent');
  });
"

echo -e "\n✅ Test terminé!"
