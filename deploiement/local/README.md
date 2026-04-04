# CMCI Belgique - Déploiement Local

## Instructions de déploiement local

### 1. Prérequis
- Node.js 18+ et npm
- PostgreSQL 14+
- Git

### 2. Backend

#### Installation
```bash
cd src/backend
npm install
```

#### Configuration
1. Copier `.env.example` vers `.env`
2. Configurer DATABASE_URL avec vos credentials PostgreSQL
3. Configurer JWT_SECRET avec une clé secrète
4. Ajouter vos clés API pour les réseaux sociaux (optionnel)

#### Base de données
```bash
# Générer le client Prisma
npm run prisma:generate

# Créer les migrations
npm run prisma:migrate

# Ouvrir Prisma Studio (interface DB)
npm run prisma:studio
```

#### Créer un premier admin
```bash
# Avec curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmci.be","password":"votre_mot_de_passe","name":"Admin CMCI"}'
```

#### Lancement
```bash
npm run dev  # Mode développement
npm start    # Mode production
```

Le backend sera accessible sur http://localhost:5000

### 3. Frontend

#### Installation
```bash
cd src/frontend
npm install
```

#### Lancement
```bash
npm run dev  # Mode développement
npm run build && npm start  # Mode production
```

Le frontend sera accessible sur http://localhost:3000

### 4. Créer les dossiers d'upload
```bash
cd src/backend
mkdir -p uploads/{events,testimonials,gallery}
```

### 5. Tester l'API
```bash
# Health check
curl http://localhost:5000/api/health

# Login admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmci.be","password":"votre_mot_de_passe"}'
```

## Structure de développement

```
.
├── src/
│   ├── frontend/          # Application Next.js
│   └── backend/           # API Express + Prisma
├── deploiement/
│   ├── local/            # Scripts de déploiement local
│   └── hostinger/        # Scripts de déploiement Hostinger
└── otherthings/
    ├── docs/             # Documentation
    ├── scripts/          # Scripts utilitaires
    └── tests/            # Tests
```

## Notes importantes

1. **Sécurité**: Changez tous les mots de passe et secrets en production
2. **CORS**: En production, configurez CORS correctement dans le backend
3. **Base de données**: Faites des backups réguliers
4. **API Keys**: Les clés des réseaux sociaux sont optionnelles pour démarrer
5. **Uploads**: Assurez-vous que le dossier uploads a les bonnes permissions
