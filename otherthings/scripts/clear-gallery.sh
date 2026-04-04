#!/bin/bash

# Script pour supprimer toutes les images de galerie
# Usage: ./clear-gallery.sh

echo "🗑️  Suppression de toutes les images de galerie..."

# Récupérer le token admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmci.be","password":"admin123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible de se connecter. Vérifiez que le backend est démarré."
  exit 1
fi

echo "✅ Connecté en tant qu'admin"

# Récupérer toutes les images avec leur ID
IMAGE_IDS=$(curl -s -X GET http://localhost:5000/api/gallery/all \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[].id')

if [ -z "$IMAGE_IDS" ]; then
  echo "ℹ️  Aucune image à supprimer."
  exit 0
fi

# Supprimer chaque image
COUNT=0
for ID in $IMAGE_IDS; do
  curl -s -X DELETE "http://localhost:5000/api/gallery/$ID" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  COUNT=$((COUNT + 1))
  echo "🗑️  Image supprimée ($COUNT)"
done

echo ""
echo "✅ $COUNT image(s) supprimée(s) avec succès!"
