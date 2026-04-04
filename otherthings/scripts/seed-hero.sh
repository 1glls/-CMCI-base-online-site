#!/bin/bash

# Script pour initialiser les slides hero avec les images existantes

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Seed Hero Slides ===${NC}\n"

# Chemin de base
BASE_DIR="/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website"
BACKEND_DIR="${BASE_DIR}/src/backend"
UPLOADS_DIR="${BACKEND_DIR}/uploads/hero"
PUBLIC_IMAGES="${BASE_DIR}/src/frontend/public/images"

# Créer le dossier uploads/hero s'il n'existe pas
mkdir -p "${UPLOADS_DIR}"

# Copier les images existantes
echo -e "${BLUE}Copie des images hero...${NC}"
cp "${PUBLIC_IMAGES}/hero-worship.jpg" "${UPLOADS_DIR}/" 2>/dev/null && echo -e "${GREEN}✓ hero-worship.jpg${NC}" || echo -e "${RED}✗ hero-worship.jpg${NC}"
cp "${PUBLIC_IMAGES}/hero-youth.jpg" "${UPLOADS_DIR}/" 2>/dev/null && echo -e "${GREEN}✓ hero-youth.jpg${NC}" || echo -e "${RED}✗ hero-youth.jpg${NC}"
cp "${PUBLIC_IMAGES}/hero-mission.jpg" "${UPLOADS_DIR}/" 2>/dev/null && echo -e "${GREEN}✓ hero-mission.jpg${NC}" || echo -e "${RED}✗ hero-mission.jpg${NC}"

# Créer les slides dans la base de données avec curl
echo -e "\n${BLUE}Création des slides dans la base de données...${NC}"

# Token admin (à récupérer depuis localStorage ou créer un admin temporaire)
# Pour cet exemple, on utilise directement Prisma

cd "${BACKEND_DIR}"

# Script Node.js pour créer les slides
node <<'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedHeroSlides() {
  try {
    // Supprimer les slides existantes
    await prisma.heroSlide.deleteMany({});
    console.log('✓ Slides existantes supprimées');

    // Créer les nouvelles slides
    const slides = [
      {
        title: "Jesus, notre modele en toutes choses",
        subtitle: "Une communaute de disciples passionnes pour Christ",
        image: "/uploads/hero/hero-worship.jpg",
        order: 1,
        status: "published"
      },
      {
        title: "Une generation qui cherche Dieu",
        subtitle: "Former la jeunesse pour impacter le monde",
        image: "/uploads/hero/hero-youth.jpg",
        order: 2,
        status: "published"
      },
      {
        title: "Atteindre 10 milliards d'ames",
        subtitle: "Proclamer l'Evangile jusqu'aux extremites de la terre",
        image: "/uploads/hero/hero-mission.jpg",
        order: 3,
        status: "published"
      }
    ];

    for (const slide of slides) {
      const created = await prisma.heroSlide.create({
        data: slide
      });
      console.log(`✓ Slide créée: ${created.title}`);
    }

    console.log('\n✅ Toutes les slides ont été créées avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedHeroSlides();
EOF

echo -e "\n${GREEN}=== Seed Hero terminé ===${NC}"
