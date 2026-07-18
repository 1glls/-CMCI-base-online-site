#!/bin/bash

echo "╔═══════════════════════════════════════════════╗"
echo "║   DIAGNOSTIC COMPLET - ÉVÉNEMENTS CMCI        ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backend
echo "1️⃣  BACKEND (http://localhost:5000)"
echo "─────────────────────────────────────────────────"
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend actif"
    
    # Tester l'API events
    EVENT_COUNT=$(curl -s http://localhost:5000/api/events | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    if [ ! -z "$EVENT_COUNT" ]; then
        echo -e "${GREEN}✓${NC} API Events répond: $EVENT_COUNT événements"
        
        # Détails des événements
        echo ""
        echo "Événements dans la base de données:"
        curl -s http://localhost:5000/api/events | python3 -c "
import sys, json
events = json.load(sys.stdin)
for e in events:
    img_status = '✓ Image' if e['image'] else '✗ Pas d\'image'
    print(f'  - {e[\"title\"]}: {img_status} ({e[\"image\"] if e[\"image\"] else \"null\"})')
" 2>/dev/null
    else
        echo -e "${RED}✗${NC} API Events ne répond pas correctement"
    fi
else
    echo -e "${RED}✗${NC} Backend non actif"
fi

echo ""
echo "2️⃣  IMAGES BACKEND"
echo "─────────────────────────────────────────────────"
UPLOAD_DIR="/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website/src/backend/uploads/events"
if [ -d "$UPLOAD_DIR" ]; then
    IMG_COUNT=$(ls -1 "$UPLOAD_DIR"/*.{jpg,jpeg,png,gif} 2>/dev/null | wc -l)
    echo -e "${GREEN}✓${NC} Dossier uploads/events existe"
    echo "   Nombre d'images: $IMG_COUNT"
    
    if [ $IMG_COUNT -gt 0 ]; then
        echo "   Images présentes:"
        ls -lh "$UPLOAD_DIR"/*.{jpg,jpeg,png,gif} 2>/dev/null | awk '{print "    - " $9 " (" $5 ")"}'
        
        # Tester l'accessibilité d'une image
        FIRST_IMG=$(ls -1 "$UPLOAD_DIR"/*.{jpg,jpeg,png,gif} 2>/dev/null | head -1 | xargs basename)
        if [ ! -z "$FIRST_IMG" ]; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000/uploads/events/$FIRST_IMG")
            if [ "$HTTP_CODE" = "200" ]; then
                echo -e "   ${GREEN}✓${NC} Images accessibles via HTTP (test: $FIRST_IMG -> $HTTP_CODE)"
            else
                echo -e "   ${RED}✗${NC} Images NON accessibles via HTTP (test: $FIRST_IMG -> $HTTP_CODE)"
            fi
        fi
    else
        echo -e "   ${YELLOW}⚠${NC} Aucune image trouvée"
    fi
else
    echo -e "${RED}✗${NC} Dossier uploads/events n'existe pas"
fi

echo ""
echo "3️⃣  FRONTEND (http://localhost:3000)"
echo "─────────────────────────────────────────────────"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo -e "${GREEN}✓${NC} Frontend actif"
    
    # Vérifier que la section events existe
    if curl -s http://localhost:3000 | grep -q 'id="evenements"'; then
        echo -e "${GREEN}✓${NC} Section #evenements présente dans le HTML"
    else
        echo -e "${RED}✗${NC} Section #evenements absente du HTML"
    fi
    
    # Vérifier que le composant Events est importé
    if grep -q "Events" "/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website/src/frontend/app/page.tsx" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Composant Events importé dans page.tsx"
    else
        echo -e "${RED}✗${NC} Composant Events non importé"
    fi
else
    echo -e "${RED}✗${NC} Frontend non actif"
fi

echo ""
echo "4️⃣  CONFIGURATION"
echo "─────────────────────────────────────────────────"

# Vérifier .env.local
if [ -f "/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website/src/frontend/.env.local" ]; then
    echo -e "${GREEN}✓${NC} Fichier .env.local existe"
    cat "/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website/src/frontend/.env.local"
else
    echo -e "${YELLOW}⚠${NC} Fichier .env.local absent"
fi

# Vérifier lib/api.ts
if [ -f "/home/guillias/Bureau/CMCI-Bel/cmci-belgique-website/src/frontend/lib/api.ts" ]; then
    echo -e "${GREEN}✓${NC} Fichier lib/api.ts existe"
else
    echo -e "${RED}✗${NC} Fichier lib/api.ts absent"
fi

echo ""
echo "5️⃣  PROCESSUS EN COURS"
echo "─────────────────────────────────────────────────"
BACKEND_PID=$(ps aux | grep "node server.js" | grep -v grep | awk '{print $2}' | head -1)
FRONTEND_PID=$(ps aux | grep "next dev" | grep -v grep | awk '{print $2}' | head -1)

if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${GREEN}✓${NC} Backend (PID: $BACKEND_PID)"
else
    echo -e "${RED}✗${NC} Backend non démarré"
fi

if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${GREEN}✓${NC} Frontend (PID: $FRONTEND_PID)"
else
    echo -e "${RED}✗${NC} Frontend non démarré"
fi

echo ""
echo "╔═══════════════════════════════════════════════╗"
echo "║              INSTRUCTIONS                      ║"
echo "╚═══════════════════════════════════════════════╝"
echo ""
echo "Pour voir les événements:"
echo "  1. Ouvrez http://localhost:3000 dans votre navigateur"
echo "  2. Ouvrez la console (F12)"
echo "  3. Cherchez les logs: 🔍 📡 ✅"
echo "  4. Faites Ctrl+Shift+R pour un hard refresh"
echo ""
echo "Pour tester l'API directement:"
echo "  curl http://localhost:5000/api/events | python3 -m json.tool"
echo ""
echo "Page de test HTML créée:"
echo "  file:///home/guillias/Bureau/CMCI-Bel/cmci-belgique-website/test-events.html"
echo ""
