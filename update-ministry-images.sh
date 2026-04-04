#!/bin/bash
cd src/backend

# Créer le dossier uploads/ministries s'il n'existe pas
mkdir -p uploads/ministries

# Télécharger des images de placeholder ou utiliser des images locales
# Pour l'instant, on va utiliser des URLs d'images via le backend

# Mettre à jour chaque ministère avec une image
echo "📝 Mise à jour des images des ministères..."

# 1. Ministère de Louange (Music)
curl -s -X PUT http://localhost:5000/api/ministries/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer \$(cat .env | grep JWT_SECRET | cut -d'=' -f2)" \
  -d '{
    "title": "Ministère de Louange et d'\''Action de Grâce",
    "description": "Notre ministère de louange est au cœur de nos cultes. Nous croyons que la louange et l'\''adoration sont des expressions essentielles de notre foi. Notre équipe de musiciens et chanteurs s'\''engage à créer une atmosphère propice à la rencontre avec Dieu à travers des chants contemporains et des cantiques traditionnels.",
    "icon": "Music",
    "image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    "order": 1,
    "status": "published"
  }' 2>/dev/null

echo "✓ Ministère de Louange mis à jour"

# 2. Ministère des Jeunes (Users)  
curl -s -X PUT http://localhost:5000/api/ministries/2 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ministère des Jeunes et Adolescents",
    "description": "Le ministère des jeunes est dédié à l'\''encadrement et à la formation spirituelle de notre jeunesse. Nous organisons des activités adaptées à leur âge, des études bibliques interactives, et des événements spéciaux pour les aider à grandir dans leur foi et à développer un caractère chrétien solide.",
    "icon": "Users",
    "image": "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800",
    "order": 2,
    "status": "published",
    "link": "/ministeres/jeunes"
  }' 2>/dev/null

echo "✓ Ministère des Jeunes mis à jour"

# 3. Enseignements (BookOpen)
curl -s -X PUT http://localhost:5000/api/ministries/3 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Enseignements et Club de Lecture",
    "description": "Ce ministère vise à approfondir notre compréhension de la Parole de Dieu et de la théologie chrétienne. Nous proposons des séminaires, des conférences et un club de lecture où nous étudions ensemble des ouvrages chrétiens enrichissants pour notre croissance spirituelle et intellectuelle.",
    "icon": "BookOpen",
    "image": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
    "order": 3,
    "status": "published",
    "link": "/ministeres/enseignements"
  }' 2>/dev/null

echo "✓ Enseignements mis à jour"

# 4. Étude Biblique (Book)
curl -s -X PUT http://localhost:5000/api/ministries/4 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Étude Biblique",
    "description": "L'\''étude biblique est un moment privilégié où nous nous réunissons pour explorer en profondeur les Écritures. À travers une approche méthodique et interactive, nous cherchons à mieux comprendre le contexte, le message et l'\''application pratique de la Parole de Dieu dans notre vie quotidienne.",
    "icon": "Book",
    "image": "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800",
    "order": 4,
    "status": "published"
  }' 2>/dev/null

echo "✓ Étude Biblique mis à jour"

# 5. Ministère de Prières (Heart)
curl -s -X PUT http://localhost:5000/api/ministries/5 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ministère de Prières, Jeûne et d'\''Intercession",
    "description": "Ce ministère est le moteur spirituel de notre église. Nous croyons fermement au pouvoir de la prière et de l'\''intercession. Nous organisons régulièrement des veillées de prière, des journées de jeûne et des chaînes de prière pour porter les besoins de notre communauté et du monde devant Dieu.",
    "icon": "Heart",
    "image": "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800",
    "order": 5,
    "status": "published"
  }' 2>/dev/null

echo "✓ Ministère de Prières mis à jour"

# 6. Littérature Chrétienne (Library)
curl -s -X PUT http://localhost:5000/api/ministries/6 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Littérature Chrétienne",
    "description": "Notre ministère de littérature chrétienne promeut la lecture et la diffusion d'\''ouvrages édifiants. Nous mettons à disposition une bibliothèque de ressources chrétiennes, dont les publications ZTF (Zacharias Tanee Fomum) et d'\''autres auteurs chrétiens, pour nourrir notre foi et notre compréhension de la vie chrétienne.",
    "icon": "Library",
    "image": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800",
    "order": 6,
    "status": "published",
    "link": "/ministeres/litterature"
  }' 2>/dev/null

echo "✓ Littérature Chrétienne mis à jour"

echo ""
echo "✅ Toutes les images des ministères ont été mises à jour!"
