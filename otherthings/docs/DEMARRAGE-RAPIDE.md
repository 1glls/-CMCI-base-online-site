# 🚀 Guide de Démarrage Rapide - CMCI Belgique

## 📋 Architecture Restructurée

Votre projet a été restructuré avec succès selon cette nouvelle architecture :

```
cmci-belgique-website/
├── src/
│   ├── frontend/          ✅ Application Next.js (votre code existant)
│   └── backend/           ✅ API Express + Prisma (nouveau)
├── deploiement/
│   ├── local/            ✅ Scripts déploiement local
│   └── hostinger/        ✅ Scripts déploiement production
└── otherthings/
    ├── docs/             ✅ Documentation complète
    └── scripts/          ✅ Scripts utilitaires
```

## 🎯 Fonctionnalités Ajoutées

### ✅ Backend Complet
- API REST avec Express.js
- Base de données Prisma (PostgreSQL/MySQL)
- Authentification JWT sécurisée
- Upload d'images avec Multer
- Routes CRUD pour événements, témoignages, galerie

### ✅ Interface Admin
- Login sécurisé sur `/admin`
- Dashboard avec statistiques
- Gestion des événements (ajouter/modifier/supprimer)
- Gestion des témoignages
- Gestion de la galerie d'images
- **Gestion des réseaux sociaux avec validation**

### ✅ Intégration Réseaux Sociaux
- Récupération automatique des posts de :
  - YouTube (vidéos)
  - Facebook (posts)
  - Instagram (posts)
  - TikTok (vidéos)
- **Système de validation par l'admin** (approuver/rejeter)
- Seuls les posts approuvés sont affichés publiquement

## 🚀 Commandes d'Exécution

### Installation Initiale

```bash
# Option 1 : Script automatique (recommandé)
./deploiement/local/deploy-local.sh

# Option 2 : Installation manuelle
cd src/backend
npm install
cp .env.example .env
# Éditer .env avec vos informations
npm run prisma:generate
npm run prisma:migrate
mkdir -p uploads/{events,testimonials,gallery}

cd ../frontend
npm install
```

### Démarrage du Projet

#### 1. Backend (Terminal 1)
```bash
cd src/backend
npm run dev
```
➡️ API disponible sur: **http://localhost:5000**

#### 2. Frontend (Terminal 2)
```bash
cd src/frontend
npm run dev
```
➡️ Site disponible sur: **http://localhost:3000**

#### Ou les deux simultanément (depuis la racine)
```bash
npm run dev
```

### Créer le Premier Administrateur

```bash
# Option 1 : Script interactif
./otherthings/scripts/create-admin.sh

# Option 2 : Commande curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cmci.be",
    "password": "VotreMotDePasse123",
    "name": "Admin CMCI"
  }'
```

## 🔑 Accès à l'Interface Admin

1. Démarrer le projet
2. Ouvrir: **http://localhost:3000/admin**
3. Se connecter avec vos identifiants
4. Accéder au dashboard admin

### Pages Admin Disponibles
- `/admin` - Login
- `/admin/dashboard` - Tableau de bord
- `/admin/events` - Gestion événements
- `/admin/testimonials` - Gestion témoignages
- `/admin/gallery` - Gestion galerie
- `/admin/social-media` - Validation réseaux sociaux ⭐

## 📱 Intégration Réseaux Sociaux

### Configuration des API Keys

Éditer `src/backend/.env` :

```env
# YouTube
YOUTUBE_API_KEY=votre_cle_youtube
YOUTUBE_CHANNEL_ID=votre_channel_id

# Facebook
FACEBOOK_PAGE_ID=votre_page_id
FACEBOOK_ACCESS_TOKEN=votre_token

# Instagram
INSTAGRAM_USER_ID=votre_user_id
INSTAGRAM_ACCESS_TOKEN=votre_token

# TikTok
TIKTOK_ACCESS_TOKEN=votre_token
```

### Utilisation

1. Aller sur `/admin/social-media`
2. Cliquer sur "Synchroniser" pour récupérer les posts
3. Les posts apparaissent avec le statut "En attente"
4. **Approuver** ou **Rejeter** chaque post
5. Les posts approuvés s'affichent sur le site public

## 🗄️ Configuration Base de Données

### PostgreSQL (Recommandé)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cmci_db"
```

### MySQL
```env
DATABASE_URL="mysql://user:password@localhost:3306/cmci_db"
```

### Commandes Prisma
```bash
cd src/backend

# Générer le client
npm run prisma:generate

# Créer/appliquer migrations
npm run prisma:migrate

# Interface graphique DB
npm run prisma:studio
```

## 📡 Endpoints API Principaux

### Authentification
- `POST /api/auth/register` - Créer admin
- `POST /api/auth/login` - Connexion

### Événements
- `GET /api/events` - Liste publique
- `POST /api/events` - Créer (admin)
- `PUT /api/events/:id` - Modifier (admin)
- `DELETE /api/events/:id` - Supprimer (admin)

### Réseaux Sociaux ⭐
- `GET /api/social-media` - Posts approuvés (public)
- `POST /api/social-media/sync-all` - Synchroniser tout (admin)
- `POST /api/social-media/fetch/:platform` - Récupérer (admin)
- `PUT /api/social-media/:id/validate` - Valider/rejeter (admin)

## 🧪 Tests

```bash
# Tester l'API
./otherthings/scripts/test-api.sh

# Health check
curl http://localhost:5000/api/health
```

## 📚 Documentation

- [README complet](./README.md)
- [Documentation technique](./otherthings/docs/DOCUMENTATION.md)
- [Guide déploiement local](./deploiement/local/README.md)
- [Guide déploiement Hostinger](./deploiement/hostinger/README.md)

## ⚠️ Notes Importantes

1. **Configuration requise** :
   - Copier `.env.example` vers `.env` dans `src/backend/`
   - Configurer au minimum : DATABASE_URL et JWT_SECRET
   - Les API keys réseaux sociaux sont optionnelles au début

2. **Sécurité** :
   - Changez TOUS les secrets en production
   - N'utilisez que HTTPS en production
   - Faites des backups réguliers de la DB

3. **Uploads** :
   - Les images sont stockées dans `src/backend/uploads/`
   - Taille max : 5MB par fichier
   - Formats acceptés : jpg, png, gif, webp

## 🆘 Problèmes Courants

### Port déjà utilisé
```bash
# Trouver et tuer le processus
lsof -ti:5000 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

### Erreur Prisma
```bash
cd src/backend
npm run prisma:generate
npm run prisma:migrate
```

### Erreur de connexion DB
Vérifier que PostgreSQL/MySQL est démarré et que DATABASE_URL est correct.

## 🎉 Prêt à Utiliser !

Votre projet est maintenant prêt avec :
- ✅ Backend API complet
- ✅ Interface admin fonctionnelle
- ✅ Intégration réseaux sociaux
- ✅ Système de validation des contenus
- ✅ Documentation complète
- ✅ Scripts de déploiement

**Bonne utilisation ! 🚀**
