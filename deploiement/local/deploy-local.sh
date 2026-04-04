#!/bin/bash

# Script de déploiement local pour CMCI Belgique
# Usage: ./deploy-local.sh

echo "🚀 Déploiement local CMCI Belgique"
echo "=================================="

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Vérifier PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL CLI n'est pas installé (optionnel)${NC}"
fi

# Backend
echo ""
echo "📦 Configuration du Backend..."
cd ../../src/backend

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Création du fichier .env${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ Veuillez configurer le fichier .env avant de continuer${NC}"
    exit 1
fi

echo "📥 Installation des dépendances backend..."
npm install

echo "🗄️  Configuration de la base de données..."
npm run prisma:generate
npm run prisma:migrate

echo "📁 Création des dossiers d'upload..."
mkdir -p uploads/{events,testimonials,gallery}

# Frontend
echo ""
echo "🎨 Configuration du Frontend..."
cd ../frontend

echo "📥 Installation des dépendances frontend..."
npm install

# Retour à la racine
cd ../../

echo ""
echo -e "${GREEN}✅ Déploiement local terminé !${NC}"
echo ""
echo "Pour démarrer l'application:"
echo "  Backend:  cd src/backend && npm run dev"
echo "  Frontend: cd src/frontend && npm run dev"
echo ""
echo "Accès:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:5000"
echo "  - Admin: http://localhost:3000/admin"
echo ""
echo "Première connexion admin:"
echo "  Utilisez curl ou Postman pour créer un admin:"
echo "  POST http://localhost:5000/api/auth/register"
echo "  Body: {\"email\":\"admin@cmci.be\",\"password\":\"your_password\",\"name\":\"Admin\"}"
