# Guide : Gestion des Événements Connectée

## ✅ Modifications Effectuées

### 1. Configuration API Centralisée
**Fichier** : `/src/frontend/lib/api.ts`
- Helper `getImageUrl()` pour gérer les URLs d'images
- Configuration centralisée de l'API_URL

### 2. Composant Events (Page d'Accueil)
**Fichier** : `/src/frontend/components/events.tsx`
- ✅ Chargement dynamique depuis l'API backend
- ✅ Affichage d'un message de chargement
- ✅ Gestion du cas "aucun événement"
- ✅ Images avec fallback automatique

### 3. Page Admin Events
**Fichier** : `/src/frontend/app/admin/events/page.tsx`
- ✅ Utilise la configuration API centralisée
- ✅ CRUD complet (Create, Read, Update, Delete)
- ✅ Upload d'images fonctionnel

### 4. Configuration Next.js
**Fichier** : `/src/frontend/next.config.mjs`
- ✅ Autorise les images depuis le backend (localhost:5000)

### 5. Script de Seed
**Fichier** : `/otherthings/scripts/seed-events.sh`
- ✅ Permet d'ajouter des événements de test

---

## 🚀 Comment Utiliser

### Démarrer les serveurs
```bash
# Terminal 1 - Backend
cd src/backend
npm start

# Terminal 2 - Frontend
cd src/frontend
npm run dev
```

### Ajouter des événements de test
```bash
./otherthings/scripts/seed-events.sh
```

### Workflow complet

#### 1. Créer un nouvel événement
1. Connectez-vous au panneau admin : `http://localhost:3000/admin`
2. Accédez à "Gestion des Événements"
3. Cliquez sur "Nouvel événement"
4. Remplissez le formulaire :
   - **Titre** : Nom de l'événement
   - **Date** : Format libre (ex: "15 FEV 2026" ou "Chaque Dimanche")
   - **Heure** : Format libre (ex: "09:00 - 18:00")
   - **Lieu** : Adresse ou nom du lieu
   - **Description** : Description complète
   - **Image** : (optionnel) Upload d'une image
5. Cliquez sur "Enregistrer"
6. ✨ L'événement apparaît **immédiatement** sur la page d'accueil !

#### 2. Modifier un événement
1. Dans la page admin des événements
2. Cliquez sur l'icône "Edit" (crayon) de l'événement
3. Modifiez les informations
4. Cliquez sur "Enregistrer"
5. ✨ Les modifications sont visibles instantanément sur la page d'accueil

#### 3. Supprimer un événement
1. Dans la page admin des événements
2. Cliquez sur l'icône "Trash" (poubelle)
3. Confirmez la suppression
4. ✨ L'événement disparaît de la page d'accueil

---

## 📱 Connexion Temps Réel

### Page d'Accueil → Backend
```
Frontend (events.tsx)
    ↓
GET /api/events
    ↓
Backend (events.routes.js)
    ↓
Base de données (Prisma)
    ↓
Retour des événements publiés
```

### Admin → Backend → Page d'Accueil
```
Admin (admin/events/page.tsx)
    ↓
POST/PUT/DELETE /api/events
    ↓
Backend sauvegarde dans la DB
    ↓
Rechargement automatique dans admin
    ↓
Visible immédiatement sur la page d'accueil
    (au prochain rechargement)
```

---

## 🔧 API Endpoints Utilisés

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/api/events` | Liste des événements publics | Non |
| GET | `/api/events/all` | Tous les événements (admin) | Oui |
| GET | `/api/events/:id` | Détails d'un événement | Non |
| POST | `/api/events` | Créer un événement | Oui |
| PUT | `/api/events/:id` | Modifier un événement | Oui |
| DELETE | `/api/events/:id` | Supprimer un événement | Oui |

---

## 🎨 Gestion des Images

### Upload
- Les images sont uploadées dans `/src/backend/uploads/events/`
- Formats acceptés : JPEG, JPG, PNG, GIF, WEBP
- Taille max : 5 MB

### Affichage
- Images servies depuis : `http://localhost:5000/uploads/events/...`
- Fallback automatique : `/images/event-conference.jpg`

---

## ⚠️ À Propos de l'Erreur CORS Google Maps

L'erreur que vous voyez :
```
Blocage d'une requête multiorigine (Cross-Origin Request) : la politique « Same Origin » 
ne permet pas de consulter la ressource distante située sur 
https://maps.googleapis.com/maps/api/mapsjs/gen_204?csp_test=true
```

**C'est normal !** Google Maps teste automatiquement les en-têtes CSP (Content Security Policy). 
Cette erreur n'affecte pas le fonctionnement de la carte et peut être ignorée en toute sécurité.

### Si vous souhaitez la masquer :
Ajoutez une clé API Google Maps dans votre configuration (non requis pour le développement local).

---

## 📝 Notes Importantes

1. **Rechargement automatique** : La page d'accueil ne se recharge pas automatiquement. 
   Les visiteurs doivent rafraîchir la page pour voir les nouveaux événements.

2. **Statut des événements** : Le champ `status` permet de créer des brouillons :
   - `published` : Visible sur la page d'accueil
   - `draft` : Visible uniquement dans l'admin

3. **Ordre d'affichage** : Les événements sont triés par date de création (plus récent en premier)

---

## 🐛 Dépannage

### Les événements n'apparaissent pas sur la page d'accueil

1. **Vérifier que le backend est démarré** :
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Vérifier les événements dans la DB** :
   ```bash
   curl http://localhost:5000/api/events
   ```

3. **Vérifier la console du navigateur** :
   - Ouvrir les DevTools (F12)
   - Onglet "Console"
   - Chercher les erreurs de fetch

### Les images ne s'affichent pas

1. **Vérifier que les images existent** :
   ```bash
   ls src/backend/uploads/events/
   ```

2. **Vérifier l'URL dans la console** :
   - Devrait être : `http://localhost:5000/uploads/events/event-xxxxx.jpg`

3. **Tester l'accès direct** :
   - Copier l'URL de l'image
   - Ouvrir dans un nouvel onglet

---

## ✨ Prochaines Améliorations Possibles

- [ ] Pagination des événements
- [ ] Filtrage par date/lieu
- [ ] Calendrier interactif
- [ ] Système de réservation
- [ ] Notifications push pour nouveaux événements
- [ ] Partage sur réseaux sociaux
- [ ] Export iCal/Google Calendar

---

**Date de création** : 2 février 2026
**Auteur** : GitHub Copilot
