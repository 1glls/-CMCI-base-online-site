#!/bin/bash

# Script pour initialiser les liens des réseaux sociaux dans la base de données

cd "$(dirname "$0")/../../src/backend"

echo "🔗 Initialisation des liens des réseaux sociaux..."

node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initSocialLinks() {
  const socialSettings = [
    { key: 'social_facebook', value: 'https://facebook.com/cmcibelgique' },
    { key: 'social_instagram', value: 'https://instagram.com/cmcibelgique' },
    { key: 'social_youtube', value: 'https://youtube.com/@cmcibelgique' },
    { key: 'social_tiktok', value: 'https://tiktok.com/@cmcibelgique' },
    { key: 'social_telegram', value: 'https://t.me/cmcibelgique' },
  ];

  for (const setting of socialSettings) {
    try {
      const existing = await prisma.settings.findUnique({
        where: { key: setting.key }
      });

      if (existing) {
        console.log(`ℹ️  ${setting.key} existe déjà`);
      } else {
        await prisma.settings.create({
          data: setting
        });
        console.log(`✅ ${setting.key} créé`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${setting.key}:`, error.message);
    }
  }

  await prisma.$disconnect();
}

initSocialLinks();
EOF

echo ""
echo "✨ Initialisation terminée !"
