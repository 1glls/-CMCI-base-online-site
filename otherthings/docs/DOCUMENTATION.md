# Documentation CMCI Belgique

## Table des matières

1. [Architecture du projet](#architecture)
2. [Guide de développement](#developpement)
3. [API Reference](#api-reference)
4. [Intégration réseaux sociaux](#reseaux-sociaux)
5. [Sécurité](#securite)

## Architecture

Le projet est structuré en monorepo avec un frontend Next.js et un backend Express:

```
src/
├── frontend/         # Application Next.js
│   ├── app/         # Pages et API routes
│   │   ├── admin/  # Interface administration
│   │   └── page.tsx
│   ├── components/  # Composants React
│   └── lib/        # Utilitaires
│
└── backend/         # API Express
    ├── routes/     # Routes API
    ├── services/   # Services métier
    ├── middleware/ # Middleware auth
    └── prisma/     # Schéma DB
```

## Développement

### Ajout d'un nouvel événement via API

```typescript
const response = await fetch('http://localhost:5000/api/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Nouveau Culte",
    date: "15 MAR 2026",
    time: "10:00",
    location: "CMCI Bruxelles",
    description: "Description de l'événement",
    status: "published"
  })
});
```

### Ajout d'une nouvelle route backend

1. Créer le fichier de route dans `src/backend/routes/`
2. Définir les endpoints avec Express
3. Ajouter le middleware d'authentification si nécessaire
4. Importer la route dans `server.js`

## API Reference

### Authentification

Toutes les routes admin nécessitent un token JWT dans le header:
```
Authorization: Bearer <token>
```

### Statuts des contenus

- `published`: Visible publiquement
- `draft`: Brouillon, non visible
- `pending`: En attente de validation (réseaux sociaux)
- `approved`: Approuvé (réseaux sociaux)
- `rejected`: Rejeté (réseaux sociaux)

## Réseaux Sociaux

### Configuration des APIs

#### YouTube
1. Créer un projet dans Google Cloud Console
2. Activer YouTube Data API v3
3. Créer une clé API
4. Ajouter dans `.env`: `YOUTUBE_API_KEY=xxx`

#### Facebook
1. Créer une app sur developers.facebook.com
2. Obtenir un access token long terme
3. Ajouter dans `.env`: `FACEBOOK_ACCESS_TOKEN=xxx`

#### Instagram
1. Convertir le compte en compte professionnel
2. Lier à une page Facebook
3. Utiliser l'API Instagram Graph
4. Ajouter dans `.env`: `INSTAGRAM_ACCESS_TOKEN=xxx`

#### TikTok
1. Créer une app sur developers.tiktok.com
2. Demander l'accès à l'API
3. Obtenir un access token
4. Ajouter dans `.env`: `TIKTOK_ACCESS_TOKEN=xxx`

### Flux de validation

1. L'admin déclenche une synchronisation
2. Le système récupère les nouveaux posts
3. Les posts sont sauvegardés avec status `pending`
4. L'admin valide ou rejette chaque post
5. Seuls les posts `approved` sont affichés publiquement

## Sécurité

### Meilleures pratiques

1. **Ne jamais commiter** les fichiers `.env`
2. **Changer** le JWT_SECRET en production
3. **Utiliser HTTPS** en production
4. **Limiter** la taille des uploads (5MB max)
5. **Valider** toutes les entrées utilisateur
6. **Sauvegarder** régulièrement la base de données

### Rotation des tokens

Les tokens JWT expirent après 7 jours. Pour changer la durée:

```javascript
// Dans routes/auth.routes.js
const token = jwt.sign(
  { userId: admin.id, role: admin.role },
  process.env.JWT_SECRET,
  { expiresIn: '30d' } // Changer ici
);
```

## Maintenance

### Backup de la base de données

```bash
# PostgreSQL
pg_dump -U username dbname > backup_$(date +%Y%m%d).sql

# MySQL
mysqldump -u username -p dbname > backup_$(date +%Y%m%d).sql
```

### Nettoyage des logs

```bash
# Supprimer les logs de plus de 30 jours
find src/backend/logs -name "*.log" -mtime +30 -delete
```

### Mise à jour des dépendances

```bash
# Vérifier les mises à jour
npm outdated

# Mettre à jour
npm update

# Ou avec npm-check-updates
npx npm-check-updates -u
npm install
```
