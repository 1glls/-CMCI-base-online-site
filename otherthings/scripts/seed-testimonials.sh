#!/bin/bash

# Script pour ajouter des témoignages par défaut
# Usage: ./seed-testimonials.sh

echo "🌱 Ajout de témoignages par défaut..."

# Récupérer le token admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmci.be","password":"admin123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible de se connecter. Vérifiez que le backend est démarré."
  exit 1
fi

echo "✅ Connecté en tant qu'admin"

# Témoignage 1
echo "📝 Ajout du témoignage de Marie D..."
curl -s -X POST http://localhost:5000/api/testimonials \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Marie D.",
    "role": "Membre depuis 2020",
    "quote": "La CMCI a transformé ma vie spirituelle. J'\''ai découvert ce que signifie vraiment être disciple de Jésus. La chaleur de la communauté et la profondeur des enseignements m'\''ont permis de grandir comme jamais auparavant.",
    "image": "/images/person-1.jpg",
    "status": "published"
  }' > /dev/null

# Témoignage 2
echo "📝 Ajout du témoignage de Jean-Pierre M..."
curl -s -X POST http://localhost:5000/api/testimonials \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jean-Pierre M.",
    "role": "Membre depuis 2018",
    "quote": "Rejoindre la CMCI Belgique a été l'\''une des meilleures décisions de ma vie. J'\''ai trouvé une famille spirituelle authentique et une vision claire pour servir Dieu dans ma génération.",
    "image": "/images/person-2.jpg",
    "status": "published"
  }' > /dev/null

# Témoignage 3
echo "📝 Ajout du témoignage d'Emmanuel K..."
curl -s -X POST http://localhost:5000/api/testimonials \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Emmanuel K.",
    "role": "Responsable jeunesse",
    "quote": "La formation des disciples est au cœur de ce que nous faisons. Voir des jeunes se lever pour Christ et impacter leur entourage est notre plus grande joie. CMCI m'\''a donné les outils pour servir efficacement.",
    "image": "/images/person-3.jpg",
    "status": "published"
  }' > /dev/null

echo ""
echo "✅ Témoignages ajoutés avec succès!"
echo ""
echo "📊 Liste des témoignages:"
curl -s http://localhost:5000/api/testimonials | jq -r '.[] | "- \(.name): \(.role)"'
