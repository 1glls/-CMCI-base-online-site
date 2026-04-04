#!/bin/bash

# Script pour initialiser les ministères de la CMCI Belgique

cd "$(dirname "$0")/../../src/backend"

echo "🙏 Initialisation des ministères CMCI Belgique..."

node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ministries = [
  {
    title: 'Ministère de Louange et d\'Action de Grâce',
    description: 'Ce ministère est dédié à conduire la congrégation dans l\'expression de l\'honneur et de l\'adoration à Dieu à travers la musique et le chant. Il implique une équipe de musiciens et de chanteurs qui sélectionnent et exécutent des hymnes et de la musique chrétienne contemporaine qui facilitent une expérience communautaire d\'adoration et glorifient le nom de Dieu.',
    icon: 'Music',
    order: 1,
    link: '#contact',
    status: 'published'
  },
  {
    title: 'Ministère des Jeunes et Adolescents',
    description: 'Ce ministère est adapté aux intérêts et aux besoins des jeunes, offrant une gamme d\'activités et d\'enseignements pour engager la jeunesse dans la communauté de l\'église. Son objectif est de favoriser la croissance spirituelle, de fournir des conseils et de créer un environnement favorable pour les jeunes individus, les aidant à développer leur relation avec Dieu.',
    icon: 'Users',
    order: 2,
    link: '#contact',
    status: 'published'
  },
  {
    title: 'Enseignements et Club de Lecture',
    description: 'Ce ministère se concentre sur l\'éducation spirituelle et intellectuelle à travers des sessions d\'enseignement biblique approfondi et des clubs de lecture. Il vise à équiper les croyants avec une compréhension solide de la Parole de Dieu et à développer leur capacité à étudier et méditer les Écritures de manière autonome.',
    icon: 'BookOpen',
    order: 3,
    link: '#contact',
    status: 'published'
  },
  {
    title: 'Étude Biblique',
    description: 'L\'objectif est l\'exploration systématique et l\'étude de la Bible. Ce ministère vise à approfondir la compréhension des Écritures, impliquant souvent des discussions de groupe, des sessions d\'enseignement et des études personnelles pour appliquer les enseignements bibliques à la vie quotidienne. Il crée un espace pour questionner, apprendre et grandir ensemble dans la foi.',
    icon: 'Book',
    order: 4,
    link: '#contact',
    status: 'published'
  },
  {
    title: 'Ministère de Prières, Jeûne et Intercession',
    description: 'Ce ministère élève la prière pour divers besoins au sein de la communauté de l\'église, de la nation et de la vision globale. Il implique des réunions régulières et peut inclure des événements spéciaux pour des efforts de prière ciblés. Le jeûne et l\'intercession sont pratiqués pour rechercher la face de Dieu et intercéder pour les âmes.',
    icon: 'Heart',
    order: 5,
    link: '#contact',
    status: 'published'
  },
  {
    title: 'Littérature Chrétienne',
    description: 'Ce ministère se consacre à la distribution et à la promotion de la littérature chrétienne édifiante, incluant les œuvres de l\'auteur ZTF (Zacharias Tanee Fomum) et d\'autres auteurs chrétiens reconnus. L\'objectif est de mettre à disposition des ressources spirituelles de qualité qui nourrissent la foi, inspirent la transformation et équipent les croyants pour le service.',
    icon: 'Library',
    order: 6,
    link: '#contact',
    status: 'published'
  }
];

async function seedMinistries() {
  try {
    console.log('📚 Création des ministères...');
    
    for (const ministry of ministries) {
      const created = await prisma.ministry.create({
        data: ministry
      });
      console.log('✓ Ministère créé:', created.title);
    }
    
    console.log('');
    console.log('✅ ' + ministries.length + ' ministères ont été créés avec succès!');
    
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await prisma.\$disconnect();
    process.exit(1);
  }
}

seedMinistries();
"
