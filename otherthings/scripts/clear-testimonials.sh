#!/bin/bash

# Script pour supprimer tous les témoignages
# Usage: ./clear-testimonials.sh

echo "🗑️  Suppression de tous les témoignages..."

# Récupérer le token admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmci.be","password":"admin123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible de se connecter. Vérifiez que le backend est démarré."
  exit 1
fi

echo "✅ Connecté en tant qu'admin"

# Récupérer tous les témoignages avec leur ID
TESTIMONIAL_IDS=$(curl -s -X GET http://localhost:5000/api/testimonials/all \
  -H "Authorization: Bearer $TOKEN" | jq -r '.[].id')

if [ -z "$TESTIMONIAL_IDS" ]; then
  echo "ℹ️  Aucun témoignage à supprimer."
  exit 0
fi

# Supprimer chaque témoignage
COUNT=0
for ID in $TESTIMONIAL_IDS; do
  curl -s -X DELETE "http://localhost:5000/api/testimonials/$ID" \
    -H "Authorization: Bearer $TOKEN" > /dev/null
  COUNT=$((COUNT + 1))
  echo "🗑️  Témoignage supprimé ($COUNT)"
done

echo ""
echo "✅ $COUNT témoignage(s) supprimé(s) avec succès!"
