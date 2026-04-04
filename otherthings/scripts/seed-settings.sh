#!/bin/bash

# Script pour ajouter des paramètres par défaut
# Usage: ./seed-settings.sh

echo "⚙️  Ajout de paramètres par défaut..."

# Récupérer le token admin
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmci.be","password":"admin123"}' | jq -r '.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Erreur: Impossible de se connecter. Vérifiez que le backend est démarré."
  exit 1
fi

echo "✅ Connecté en tant qu'admin"

# Email de contact
echo "📧 Configuration de l'email de contact..."
curl -s -X PUT http://localhost:5000/api/settings/contact_email \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"contact@cmci-belgique.org"}' > /dev/null

# Téléphone
echo "📞 Configuration du numéro de téléphone..."
curl -s -X PUT http://localhost:5000/api/settings/contact_phone \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"+32 XXX XX XX XX"}' > /dev/null

# Adresse
echo "📍 Configuration de l'adresse..."
curl -s -X PUT http://localhost:5000/api/settings/address \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"Bruxelles, Belgique"}' > /dev/null

# Horaires
echo "🕐 Configuration des horaires de culte..."
curl -s -X PUT http://localhost:5000/api/settings/worship_schedule \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"Dimanche 10h00 - 12h30"}' > /dev/null

# Message d'accueil
echo "👋 Configuration du message d'accueil..."
curl -s -X PUT http://localhost:5000/api/settings/welcome_message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"Bienvenue à la Communauté Missionnaire Chrétienne Internationale de Belgique"}' > /dev/null

# Facebook
echo "📱 Configuration Facebook..."
curl -s -X PUT http://localhost:5000/api/settings/facebook_url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"https://facebook.com/cmci.belgique"}' > /dev/null

# YouTube
echo "📹 Configuration YouTube..."
curl -s -X PUT http://localhost:5000/api/settings/youtube_url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"https://youtube.com/@cmcibelgique"}' > /dev/null

# Instagram
echo "📸 Configuration Instagram..."
curl -s -X PUT http://localhost:5000/api/settings/instagram_url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"https://instagram.com/cmci.belgique"}' > /dev/null

echo ""
echo "✅ Paramètres ajoutés avec succès!"
echo ""
echo "📊 Liste des paramètres:"
curl -s http://localhost:5000/api/settings -H "Authorization: Bearer $TOKEN" | jq -r '.[] | "- \(.key): \(.value)"'
