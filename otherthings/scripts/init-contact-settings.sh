#!/bin/bash

# Script pour initialiser les paramètres de contact

BASE_DIR="/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website"
BACKEND_DIR="${BASE_DIR}/src/backend"

echo "=== Initialisation des paramètres de contact ==="

cd "${BACKEND_DIR}"

node <<'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initContactSettings() {
  try {
    const settings = [
      { key: 'contact_phone', value: '+32 2 123 45 67' },
      { key: 'contact_email', value: 'contact@cmci.be' },
      { key: 'contact_address', value: '123 Avenue Louise, 1050 Bruxelles, Belgique' },
      { key: 'contact_hours', value: 'Lundi - Samedi: 9h00 - 18h00' }
    ];

    for (const setting of settings) {
      const existing = await prisma.settings.findUnique({
        where: { key: setting.key }
      });

      if (!existing) {
        await prisma.settings.create({ data: setting });
        console.log(`✅ ${setting.key} créé`);
      } else {
        console.log(`ℹ️  ${setting.key} existe déjà`);
      }
    }

    console.log('\n✅ Paramètres de contact initialisés!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

initContactSettings();
EOF

echo "✅ Terminé!"
