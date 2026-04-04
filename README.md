# CMCI Belgique - Site Web Officiel

Site web de la Communauté Missionnaire Chrétienne Internationale (CMCI) en Belgique avec interface d'administration et intégration réseaux sociaux.

## 🏗️ Architecture

```
cmci-belgique-website/
├── src/
│   ├── frontend/          # Application Next.js (React + TypeScript)
│   │   ├── app/          # Pages et routes
│   │   ├── components/   # Composants React
│   │   └── lib/          # Utilitaires
│   │
│   └── backend/          # API REST (Express + Prisma)
│       ├── routes/       # Routes API
│       ├── services/     # Services (réseaux sociaux, etc.)
│       ├── middleware/   # Middleware d'authentification
│       └── prisma/       # Schéma base de données
│
├── deploiement/
│   ├── local/           # Scripts de déploiement local
│   └── hostinger/       # Scripts de déploiement Hostinger
│
└── otherthings/
    ├── docs/            # Documentation
    ├── scripts/         # Scripts utilitaires
    └── tests/           # Tests
```

## ✨ Fonctionnalités

### Frontend Public
- Page d'accueil avec hero, vision, valeurs
- Section événements dynamique
- Galerie d'images par catégories
- Témoignages en carrousel
- Newsletter
- Flux de réseaux sociaux approuvés

### Interface Admin
- 🔐 Authentification sécurisée (JWT)
- 📅 Gestion des événements (CRUD complet)
- 💬 Gestion des témoignages
- 🖼️ Gestion de la galerie d'images
- 📱 **Intégration réseaux sociaux** avec validation admin:
  - YouTube
  - Facebook
  - Instagram
  - TikTok
- ⚙️ Paramètres du site

### Backend API
- API REST complète
- Base de données PostgreSQL/MySQL
- Upload d'images avec Multer
- Authentification JWT
- Récupération automatique des posts réseaux sociaux
- Système de validation des contenus

## 🚀 Installation

### Prérequis
- Node.js 18+
- PostgreSQL ou MySQL
- npm ou pnpm

### Installation rapide

```bash
# Cloner le projet
git clone <repository-url>
cd cmci-belgique-website

# Installer toutes les dépendances
npm run install:all

# Ou utiliser le script de déploiement
./deploiement/local/deploy-local.sh
```

### Configuration Backend

1. Créer le fichier `.env` dans `src/backend/`:
```bash
cd src/backend
cp .env.example .env
```

2. Configurer les variables d'environnement:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cmci_db"
JWT_SECRET="votre_secret_jwt_tres_securise"
PORT=5000

# API Keys réseaux sociaux (optionnel)
YOUTUBE_API_KEY=
FACEBOOK_ACCESS_TOKEN=
INSTAGRAM_ACCESS_TOKEN=
TIKTOK_ACCESS_TOKEN=
```

3. Initialiser la base de données:
```bash
cd src/backend
npm run prisma:generate
npm run prisma:migrate
```

4. Créer les dossiers d'upload:
```bash
mkdir -p uploads/{events,testimonials,gallery}
```

### Démarrage

#### Mode développement (avec auto-reload)
```bash
# Démarrer backend et frontend simultanément
npm run dev

# Ou séparément:
npm run dev:backend  # Backend sur http://localhost:5000
npm run dev:frontend # Frontend sur http://localhost:3000
```

#### Mode production
```bash
npm run build
npm start
```

## 👤 Premier utilisateur admin

Créer un compte admin via l'API:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@cmci.be",
    "password": "votre_mot_de_passe",
    "name": "Admin CMCI"
  }'
```

Ensuite connectez-vous sur: http://localhost:3000/admin

## 📡 API Endpoints

### Authentification
- `POST /api/auth/register` - Créer un admin
- `POST /api/auth/login` - Connexion admin

### Événements
- `GET /api/events` - Liste publique des événements
- `GET /api/events/all` - Tous les événements (admin)
- `POST /api/events` - Créer un événement (admin)
- `PUT /api/events/:id` - Modifier (admin)
- `DELETE /api/events/:id` - Supprimer (admin)

### Témoignages
- `GET /api/testimonials` - Liste publique
- `POST /api/testimonials` - Créer (admin)
- `PUT /api/testimonials/:id` - Modifier (admin)
- `DELETE /api/testimonials/:id` - Supprimer (admin)

### Galerie
- `GET /api/gallery` - Liste publique
- `POST /api/gallery` - Ajouter image (admin)
- `PUT /api/gallery/:id` - Modifier (admin)
- `DELETE /api/gallery/:id` - Supprimer (admin)

### Réseaux Sociaux
- `GET /api/social-media` - Posts approuvés (public)
- `GET /api/social-media/all` - Tous les posts (admin)
- `POST /api/social-media/sync-all` - Synchroniser tous (admin)
- `POST /api/social-media/fetch/:platform` - Récupérer posts (admin)
- `PUT /api/social-media/:id/validate` - Valider/rejeter (admin)

## 🔧 Technologies utilisées

### Frontend
- **Next.js 16** - Framework React
- **TypeScript** - Typage statique
- **Tailwind CSS** - Styling
- **Radix UI** - Composants UI
- **Lucide React** - Icônes

### Backend
- **Express.js** - Framework Node.js
- **Prisma** - ORM base de données
- **JWT** - Authentification
- **Multer** - Upload fichiers
- **Axios** - Requêtes HTTP (APIs sociales)
- **bcryptjs** - Hash passwords

### APIs Externes
- YouTube Data API v3
- Facebook Graph API
- Instagram Graph API
- TikTok API for Business

## 📚 Documentation

- [Déploiement Local](./deploiement/local/README.md)
- [Déploiement Hostinger](./deploiement/hostinger/README.md)

## 🔒 Sécurité

- Authentification JWT sécurisée
- Passwords hashés avec bcrypt
- Middleware de protection des routes admin
- Validation des uploads d'images
- CORS configuré
- Variables d'environnement pour les secrets

## 🌐 Déploiement

### Local
```bash
./deploiement/local/deploy-local.sh
```

### Hostinger
Suivre le guide dans `deploiement/hostinger/README.md`

## 📝 License

Propriété de CMCI Belgique

## 👥 Contact

CMCI Belgique - contact@cmci.be
