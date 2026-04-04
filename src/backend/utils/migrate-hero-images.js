/**
 * Script de migration : re-traite toutes les images hero existantes
 * pour générer des versions desktop (1920x1080) et mobile (1080x1350).
 * 
 * Usage: 
 *   node utils/migrate-hero-images.js          # Traite seulement les slides sans version mobile
 *   node utils/migrate-hero-images.js --force   # Force le retraitement de TOUS les slides
 */

const { PrismaClient } = require('@prisma/client');
const { processHeroImage, deleteHeroImages } = require('./image-processor');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();
const FORCE = process.argv.includes('--force');

async function migrateHeroImages() {
  console.log(`🔄 Migration des images hero${FORCE ? ' (FORCE - retraitement complet)' : ''}...\n`);

  const slides = await prisma.heroSlide.findMany();
  console.log(`📊 ${slides.length} slides trouvés au total\n`);

  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const slide of slides) {
    // En mode normal, skip les slides déjà traités
    if (!FORCE && slide.imageMobile) {
      console.log(`⏭️  Skip "${slide.title}" - déjà traité`);
      skipped++;
      continue;
    }

    // Déterminer la source de l'image
    let imageSource = slide.image;

    // Si l'image actuelle est déjà une version traitée (xxx-desktop.webp),
    // on ne peut pas la réutiliser comme source. Chercher l'originale.
    if (imageSource && imageSource.includes('-desktop.webp')) {
      // C'est une image déjà traitée, chercher dans l'événement lié
      if (slide.eventId) {
        try {
          const event = await prisma.event.findUnique({ where: { id: slide.eventId } });
          if (event && event.image) {
            imageSource = event.image;
            console.log(`🔗 "${slide.title}" → image originale de l'événement: ${event.title}`);
          } else {
            console.log(`   ⚠️ Événement sans image, réutilisation de l'image traitée`);
          }
        } catch (e) {
          console.log(`   ⚠️ Impossible de charger l'événement: ${e.message}`);
        }
      } else {
        // Pas d'événement lié et image déjà traitée → on la réutilise quand même
        console.log(`   ℹ️ "${slide.title}" - image déjà traitée, retraitement avec le nouveau algorithme`);
      }
    }

    // Si pas d'image propre mais lié à un événement, utiliser l'image de l'événement
    if (!imageSource && slide.eventId) {
      try {
        const event = await prisma.event.findUnique({ where: { id: slide.eventId } });
        if (event && event.image) {
          imageSource = event.image;
          console.log(`🔗 "${slide.title}" → image de l'événement: ${event.title}`);
        }
      } catch (e) {
        console.log(`   ⚠️ Impossible de charger l'événement: ${e.message}`);
      }
    }

    if (!imageSource) {
      console.log(`⏭️  Skip "${slide.title}" - pas d'image (ni propre, ni événement)`);
      skipped++;
      continue;
    }

    console.log(`\n🖼️  Traitement de "${slide.title}"...`);
    console.log(`   Image source: ${imageSource}`);

    try {
      // Résoudre le chemin de l'image source
      const imagePath = imageSource.startsWith('/') ? imageSource.slice(1) : imageSource;
      const fullPath = path.resolve(imagePath);

      if (!fs.existsSync(fullPath)) {
        console.log(`   ❌ Fichier introuvable: ${fullPath}`);
        errors++;
        continue;
      }

      // Lire le buffer de l'image AVANT de supprimer quoi que ce soit
      const imageBuffer = fs.readFileSync(fullPath);

      // Générer un nouveau nom unique
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const baseFilename = 'hero-' + uniqueSuffix;

      // Supprimer les anciennes versions traitées si elles existent
      if (FORCE && slide.image && slide.imageMobile) {
        deleteHeroImages(slide.image, slide.imageMobile);
      }

      // Traiter l'image avec sharp (depuis le buffer en mémoire)
      const result = await processHeroImage(imageBuffer, baseFilename);

      // Mettre à jour la base de données
      await prisma.heroSlide.update({
        where: { id: slide.id },
        data: {
          image: result.desktop,
          imageMobile: result.mobile
        }
      });

      console.log(`   ✅ Desktop: ${result.desktop}`);
      console.log(`   ✅ Mobile:  ${result.mobile}`);
      processed++;

    } catch (error) {
      console.error(`   ❌ Erreur: ${error.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Résultats de la migration:`);
  console.log(`   ✅ Traités:  ${processed}`);
  console.log(`   ⏭️  Ignorés:  ${skipped}`);
  console.log(`   ❌ Erreurs:  ${errors}`);
  console.log('='.repeat(50));

  await prisma.$disconnect();
}

migrateHeroImages().catch((error) => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
