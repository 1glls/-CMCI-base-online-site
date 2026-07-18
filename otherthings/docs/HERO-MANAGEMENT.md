# Gestion de la Section Hero - Documentation

## Vue d'ensemble

La section Hero de la page d'accueil affiche maintenant dynamiquement :
1. **Slides personnalisés** : Créés et gérés depuis l'interface admin
2. **Événements du mois** : Les événements du mois en cours sont automatiquement ajoutés au carrousel

## Architecture

### Base de données
- **Modèle** : `HeroSlide` dans Prisma
- **Champs** :
  - `id` : UUID (généré automatiquement)
  - `title` : Titre de la slide
  - `subtitle` : Sous-titre / description
  - `image` : Chemin vers l'image
  - `order` : Ordre d'affichage (slides triées par ce champ)
  - `status` : `published` ou `draft`
  - `createdAt`, `updatedAt` : Timestamps

### API Backend
- **Endpoint** : `http://localhost:5000/api/hero`
- **Routes disponibles** :
  - `GET /api/hero` : Récupère toutes les slides publiées (triées par order)
  - `GET /api/hero/all` : Récupère toutes les slides (admin)
  - `GET /api/hero/:id` : Récupère une slide spécifique
  - `POST /api/hero` : Créer une nouvelle slide (admin, avec upload d'image)
  - `PUT /api/hero/:id` : Modifier une slide existante (admin, avec upload d'image)
  - `DELETE /api/hero/:id` : Supprimer une slide (admin)

- **Upload d'images** : `/uploads/hero/` (avec Multer, max 5MB)

### Frontend

#### Composant Hero
- **Fichier** : `src/frontend/components/hero.tsx`
- **Fonctionnement** :
  1. Charge les slides personnalisées depuis `/api/hero`
  2. Charge les événements depuis `/api/events`
  3. Filtre les événements du mois en cours
  4. Combine les deux listes et trie par `order`
  5. Affiche dans un carrousel avec navigation

#### Interface Admin
- **URL** : `http://localhost:3000/admin/hero`
- **Fichier** : `src/frontend/app/admin/hero/page.tsx`
- **Fonctionnalités** :
  - Création de nouvelles slides avec upload d'image
  - Édition de slides existantes
  - Modification de l'ordre d'affichage
  - Changement du statut (published/draft)
  - Suppression de slides
  - Prévisualisation des images

## Utilisation

### Accès à l'interface admin
1. Se connecter à l'admin : `http://localhost:3000/admin`
2. Cliquer sur "Section Hero" dans le dashboard
3. Gérer les slides hero

### Créer une nouvelle slide
1. Remplir le formulaire :
   - **Titre** : Message principal (ex: "Jesus, notre modèle")
   - **Sous-titre** : Message secondaire (ex: "Une communauté de disciples")
   - **Ordre** : Position dans le carrousel (1, 2, 3...)
   - **Image** : Sélectionner une image (JPG, PNG, GIF, WEBP max 5MB)
2. Cliquer sur "Créer la slide"

### Modifier une slide existante
1. Cliquer sur "Modifier" sur la slide
2. Mettre à jour les informations
3. Cliquer sur "Mettre à jour"

### Ordre d'affichage
- Les slides sont triées par le champ `order` (croissant)
- Les événements du mois sont ajoutés avec `order: 999` (à la fin)
- Pour réorganiser : modifier le numéro d'ordre de chaque slide

### Événements du mois
- Automatiquement ajoutés au carrousel
- Maximum 2 événements affichés
- Filtrés par le mois en cours
- Apparaissent après les slides personnalisées

## Scripts utiles

### Initialiser les slides hero
```bash
./otherthings/scripts/seed-hero.sh
```
Ce script :
- Copie les images hero de `public/images` vers `uploads/hero`
- Crée 3 slides initiales dans la base de données

### Vérifier l'API
```bash
# Récupérer toutes les slides publiées
curl http://localhost:5000/api/hero

# Récupérer tous les événements
curl http://localhost:5000/api/events
```

## Structure des fichiers

```
src/
├── backend/
│   ├── routes/
│   │   └── hero.routes.js          # Routes API pour hero
│   ├── uploads/
│   │   └── hero/                   # Images uploadées
│   └── prisma/
│       └── schema.prisma           # Modèle HeroSlide
│
├── frontend/
│   ├── components/
│   │   └── hero.tsx                # Composant Hero dynamique
│   └── app/
│       └── admin/
│           ├── dashboard/
│           │   └── page.tsx        # Dashboard avec lien Hero
│           └── hero/
│               └── page.tsx        # Interface admin Hero

otherthings/
└── scripts/
    └── seed-hero.sh                # Script d'initialisation
```

## Notes techniques

### Filtre des événements par mois
Le composant Hero filtre les événements en recherchant le mois actuel dans le champ `date` :
- Utilise les noms de mois en français (janv, fev, mars, etc.)
- Limite à 2 événements maximum
- Les événements sans correspondance de mois sont ignorés

### Gestion des images
- **Slides personnalisées** : Chemin complet `${API_URL}${slide.image}`
- **Événements** : Utilise `getImageUrl(event.image)` depuis `lib/api.ts`
- **Fallback** : `/images/hero-worship.jpg` si aucune image

### Authentification
- Les routes admin (`POST`, `PUT`, `DELETE`) nécessitent un token JWT
- Le token est stocké dans `localStorage` comme "adminToken"
- L'interface admin vérifie automatiquement l'authentification

## Dépannage

### Les slides ne s'affichent pas
1. Vérifier que le backend est démarré : `ps aux | grep "node.*server.js"`
2. Tester l'API : `curl http://localhost:5000/api/hero`
3. Vérifier les logs du navigateur (console F12)

### Les images ne s'affichent pas
1. Vérifier que les images existent dans `/uploads/hero/`
2. Vérifier les permissions du dossier
3. Tester l'accès direct : `http://localhost:5000/uploads/hero/hero-worship.jpg`

### Les événements du mois ne s'affichent pas
1. Vérifier le format du champ `date` des événements
2. S'assurer que le mois est écrit en français
3. Vérifier la console pour les logs de débogage

## Améliorations futures

- [ ] Interface de réorganisation drag & drop
- [ ] Prévisualisation en temps réel du carrousel
- [ ] Gestion des images (redimensionnement automatique)
- [ ] Planification des slides (date de début/fin)
- [ ] Analytics sur les slides les plus vues
- [ ] Support multilingue (FR/NL/EN)
