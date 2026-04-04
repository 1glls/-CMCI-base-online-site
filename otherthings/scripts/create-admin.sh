#!/bin/bash

# Script de création du premier admin
# Usage: ./create-admin.sh

API_URL="http://localhost:5000"

echo "🔐 Création du premier administrateur CMCI"
echo "=========================================="

read -p "Email: " EMAIL
read -sp "Mot de passe: " PASSWORD
echo ""
read -p "Nom complet: " NAME

echo -e "\nCréation de l'administrateur..."

RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}")

if echo "$RESPONSE" | grep -q "Admin created successfully"; then
    echo "✅ Administrateur créé avec succès !"
    echo "Vous pouvez maintenant vous connecter sur http://localhost:3000/admin"
else
    echo "❌ Erreur lors de la création:"
    echo "$RESPONSE"
fi
