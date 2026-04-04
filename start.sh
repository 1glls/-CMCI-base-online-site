#!/bin/bash

# 🚀 Script de démarrage rapide CMCI Belgique
# Exécuter ce fichier pour lancer le projet complet

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        🚀 CMCI Belgique - Démarrage Rapide                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier si les dépendances sont installées
if [ ! -d "src/backend/node_modules" ] || [ ! -d "src/frontend/node_modules" ]; then
    echo -e "${YELLOW}⚠ Les dépendances ne sont pas installées${NC}"
    echo -e "${BLUE}Voulez-vous lancer l'installation ? (o/n)${NC}"
    read -r response
    if [[ "$response" =~ ^([oO][uU][iI]|[oO])$ ]]; then
        ./deploiement/local/deploy-local.sh
    else
        echo -e "${RED}Installation annulée${NC}"
        exit 1
    fi
fi

# Vérifier la configuration backend
if [ ! -f "src/backend/.env" ]; then
    echo -e "${YELLOW}⚠ Fichier .env manquant pour le backend${NC}"
    echo -e "${BLUE}Création du fichier .env...${NC}"
    cd src/backend
    cp .env.example .env
    echo -e "${GREEN}✓ Fichier .env créé${NC}"
    echo -e "${YELLOW}⚠ Veuillez éditer src/backend/.env avec vos configurations${NC}"
    cd ../..
fi

echo ""
echo -e "${BLUE}┌──────────────────────────────────────────────────────────┐${NC}"
echo -e "${BLUE}│  Démarrage des services...                               │${NC}"
echo -e "${BLUE}└──────────────────────────────────────────────────────────┘${NC}"
echo ""

# Démarrer le backend dans un nouveau terminal
echo -e "${GREEN}🔧 Démarrage du Backend (API)...${NC}"
gnome-terminal --tab --title="Backend CMCI" -- bash -c "cd src/backend && npm run dev; exec bash" 2>/dev/null || \
xterm -T "Backend CMCI" -e "cd src/backend && npm run dev; bash" 2>/dev/null || \
konsole --new-tab -e bash -c "cd src/backend && npm run dev; exec bash" 2>/dev/null || \
{
    echo -e "${YELLOW}⚠ Impossible d'ouvrir un nouveau terminal automatiquement${NC}"
    echo -e "${YELLOW}Veuillez ouvrir un terminal et exécuter:${NC}"
    echo -e "${BLUE}    cd src/backend && npm run dev${NC}"
}

sleep 2

# Démarrer le frontend dans un nouveau terminal
echo -e "${GREEN}🎨 Démarrage du Frontend (Site web)...${NC}"
gnome-terminal --tab --title="Frontend CMCI" -- bash -c "cd src/frontend && npm run dev; exec bash" 2>/dev/null || \
xterm -T "Frontend CMCI" -e "cd src/frontend && npm run dev; bash" 2>/dev/null || \
konsole --new-tab -e bash -c "cd src/frontend && npm run dev; exec bash" 2>/dev/null || \
{
    echo -e "${YELLOW}⚠ Impossible d'ouvrir un nouveau terminal automatiquement${NC}"
    echo -e "${YELLOW}Veuillez ouvrir un terminal et exécuter:${NC}"
    echo -e "${BLUE}    cd src/frontend && npm run dev${NC}"
}

sleep 3

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Démarrage en cours !${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📍 ${BLUE}Accès aux applications :${NC}"
echo ""
echo -e "   🌐 Site Web Public:"
echo -e "      ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "   🔐 Interface Admin:"
echo -e "      ${GREEN}http://localhost:3000/admin${NC}"
echo ""
echo -e "   🔧 API Backend:"
echo -e "      ${GREEN}http://localhost:5000${NC}"
echo -e "      Test: ${BLUE}http://localhost:5000/api/health${NC}"
echo ""
echo -e "${YELLOW}────────────────────────────────────────────────────────────${NC}"
echo -e "${YELLOW}💡 Conseil:${NC}"
echo -e "   Si c'est votre première utilisation, créez un admin:"
echo -e "   ${BLUE}./otherthings/scripts/create-admin.sh${NC}"
echo -e "${YELLOW}────────────────────────────────────────────────────────────${NC}"
echo ""
echo -e "${BLUE}📚 Documentation disponible dans:${NC}"
echo -e "   - README.md"
echo -e "   - DEMARRAGE-RAPIDE.md"
echo -e "   - STRUCTURE.txt"
echo ""
echo -e "${GREEN}Bonne utilisation ! 🎉${NC}"
