#!/bin/bash

# Script pour ajouter des images de galerie par défaut
# Usage: ./seed-gallery.sh

echo "🌱 Ajout d'images de galerie par défaut..."

# Récupérer le token admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmci.be","password":"admin123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible de se connecter. Vérifiez que le backend est démarré."
  exit 1
fi

echo "✅ Connecté en tant qu'admin"

# Image 1
echo "📸 Ajout de l'image: Culte dominical..."
curl -s -X POST http://localhost:5000/api/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Culte dominical",
    "src": "/images/gallery-1.jpg",
    "category": "Cultes",
    "status": "published"
  }' > /dev/null

# Image 2
echo "📸 Ajout de l'image: Etude biblique jeunesse..."
curl -s -X POST http://localhost:5000/api/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Etude biblique jeunesse",
    "src": "/images/gallery-2.jpg",
    "category": "Jeunesse",
    "status": "published"
  }' > /dev/null

# Image 3
echo "📸 Ajout de l'image: Mission de rue..."
curl -s -X POST http://localhost:5000/api/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Mission de rue",
    "src": "/images/gallery-3.jpg",
    "category": "Missions",
    "status": "published"
  }' > /dev/null

# Image 4
echo "📸 Ajout de l'image: Baptême..."
curl -s -X POST http://localhost:5000/api/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Baptême",
    "src": "/images/gallery-4.jpg",
    "category": "Evenements",
    "status": "published"
  }' > /dev/null

# Image 5
echo "📸 Ajout de l'image: Chorale..."
curl -s -X POST http://localhost:5000/api/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Chorale",
    "src": "/images/gallery-5.jpg",
    "category": "Cultes",
    "status": "published"
  }' > /dev/null

# Image 6
echo "📸 Ajout de l'image: Repas communautaire..."
curl -s -X POST http://localhost:5000/api/gallery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alt": "Repas communautaire",
    "src": "/images/gallery-6.jpg",
    "category": "Evenements",
    "status": "published"
  }' > /dev/null

echo ""
echo "✅ Images de galerie ajoutées avec succès!"
echo ""
echo "📊 Liste des images:"
curl -s http://localhost:5000/api/gallery | jq -r '.[] | "- \(.alt) (\(.category))"'
