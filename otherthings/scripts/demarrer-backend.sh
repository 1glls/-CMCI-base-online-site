#!/bin/bash

echo "🚀 Démarrage du Backend CMCI"
echo "============================"
echo ""

cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website/src/backend

echo "📦 Vérification des dépendances..."
if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances..."
    npm install
fi

echo "🗄️ Vérification de la base de données..."
if [ ! -f "dev.db" ]; then
    echo "Initialisation de la base de données..."
    npm run prisma:generate
    npm run prisma:migrate
fi

echo "📁 Création des dossiers d'upload..."
mkdir -p uploads/{events,testimonials,gallery}

echo ""
echo "✅ Backend prêt ! Démarrage..."
echo "   API: http://localhost:5000"
echo ""

node server.js
