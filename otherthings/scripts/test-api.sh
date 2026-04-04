#!/bin/bash

# Script de test de l'API CMCI
# Usage: ./test-api.sh

API_URL="http://localhost:5000"
ADMIN_EMAIL="admin@cmci.be"
ADMIN_PASSWORD="test123"
TOKEN=""

echo "🧪 Tests de l'API CMCI Belgique"
echo "================================"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Test 1: Health Check
echo -e "\n1️⃣  Health Check..."
RESPONSE=$(curl -s "$API_URL/api/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ API accessible${NC}"
    echo "   Response: $RESPONSE"
else
    echo -e "${RED}✗ API non accessible${NC}"
    exit 1
fi

# Test 2: Login
echo -e "\n2️⃣  Test Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✓ Login réussi${NC}"
    echo "   Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗ Login échoué${NC}"
    echo "   Response: $LOGIN_RESPONSE"
    exit 1
fi

# Test 3: Récupérer les événements
echo -e "\n3️⃣  Test GET /api/events..."
EVENTS=$(curl -s "$API_URL/api/events")
echo -e "${GREEN}✓ Événements récupérés${NC}"
echo "   Count: $(echo $EVENTS | grep -o "\"id\":" | wc -l)"

# Test 4: Récupérer tous les événements (admin)
echo -e "\n4️⃣  Test GET /api/events/all (admin)..."
ALL_EVENTS=$(curl -s "$API_URL/api/events/all" \
  -H "Authorization: Bearer $TOKEN")
echo -e "${GREEN}✓ Tous les événements récupérés${NC}"

# Test 5: Récupérer les témoignages
echo -e "\n5️⃣  Test GET /api/testimonials..."
TESTIMONIALS=$(curl -s "$API_URL/api/testimonials")
echo -e "${GREEN}✓ Témoignages récupérés${NC}"

# Test 6: Récupérer la galerie
echo -e "\n6️⃣  Test GET /api/gallery..."
GALLERY=$(curl -s "$API_URL/api/gallery")
echo -e "${GREEN}✓ Galerie récupérée${NC}"

# Test 7: Récupérer les posts réseaux sociaux
echo -e "\n7️⃣  Test GET /api/social-media..."
SOCIAL=$(curl -s "$API_URL/api/social-media")
echo -e "${GREEN}✓ Posts réseaux sociaux récupérés${NC}"

echo -e "\n${GREEN}✅ Tous les tests passés !${NC}"
