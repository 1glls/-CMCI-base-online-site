#!/bin/bash

# Script pour initialiser les assemblées dans la base de données

cd "$(dirname "$0")/../../src/backend"

echo "🏛️ Initialisation des assemblées..."

node << 'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAssemblies() {
  const assemblies = [
    {
      city: 'Bruxelles',
      address: '123 Avenue Louise, 1050 Bruxelles',
      latitude: 50.8370,
      longitude: 4.3676,
      schedule: 'Dimanche 10h00 | Mercredi 19h00',
      phone: '+32 2 123 45 67',
      email: 'bruxelles@cmci.be',
      status: 'published'
    },
    {
      city: 'Liège',
      address: '45 Rue de la Station, 4000 Liège',
      latitude: 50.6326,
      longitude: 5.5797,
      schedule: 'Dimanche 10h30 | Jeudi 19h30',
      phone: '+32 4 234 56 78',
      email: 'liege@cmci.be',
      status: 'published'
    },
    {
      city: 'Anvers',
      address: '78 Meir Street, 2000 Antwerpen',
      latitude: 51.2194,
      longitude: 4.4025,
      schedule: 'Dimanche 11h00 | Mardi 19h00',
      phone: '+32 3 345 67 89',
      email: 'anvers@cmci.be',
      status: 'published'
    }
  ];

  for (const assembly of assemblies) {
    try {
      const existing = await prisma.assembly.findFirst({
        where: { city: assembly.city }
      });

      if (existing) {
        console.log(`ℹ️  Assemblée de ${assembly.city} existe déjà`);
      } else {
        await prisma.assembly.create({
          data: assembly
        });
        console.log(`✅ Assemblée de ${assembly.city} créée`);
      }
    } catch (error) {
      console.error(`❌ Erreur pour ${assembly.city}:`, error.message);
    }
  }

  await prisma.$disconnect();
}

seedAssemblies();
EOF

echo ""
echo "✨ Initialisation terminée !"
