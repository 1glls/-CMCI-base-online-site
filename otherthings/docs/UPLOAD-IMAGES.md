# Upload d'Images - Guide Rapide

## Fonctionnalités ajoutées

### 1. Page Admin Témoignages (`/admin/testimonials`)
- **Upload de fichier** : Cliquez sur "Choisir un fichier" pour uploader une image depuis votre machine
- **URL** : Ou collez directement l'URL d'une image en ligne
- **Aperçu en temps réel** : Visualisez l'image avant de sauvegarder
- **Formats acceptés** : JPEG, JPG, PNG, GIF, WebP
- **Taille maximum** : 5 MB

### 2. Page Admin Galerie (`/admin/gallery`)
- Mêmes fonctionnalités que les témoignages
- Organisation par catégories
- Statut : Publié ou Brouillon

## Utilisation

### Pour uploader une image depuis votre machine :
1. Cliquez sur le bouton "Choisir un fichier"
2. Sélectionnez une image (JPG, PNG, etc.)
3. L'aperçu s'affiche automatiquement
4. Remplissez les autres champs (nom, description, etc.)
5. Cliquez sur "Créer" ou "Modifier"

### Pour utiliser une URL :
1. Collez l'URL dans le champ "URL d'une image en ligne"
2. L'aperçu s'affiche automatiquement
3. Remplissez les autres champs
4. Cliquez sur "Créer" ou "Modifier"

## Stockage des images

Les images uploadées sont stockées dans :
- **Témoignages** : `/src/backend/uploads/testimonials/`
- **Galerie** : `/src/backend/uploads/gallery/`

Les images sont automatiquement renommées avec un timestamp unique pour éviter les conflits.

## Backend

Le backend utilise **Multer** pour gérer les uploads de fichiers :
- Validation automatique des types de fichiers
- Limitation de taille à 5 MB
- Stockage sécurisé avec noms uniques

## Notes importantes

1. **Les deux options sont disponibles** : Vous pouvez choisir d'uploader un fichier OU d'utiliser une URL, mais pas les deux en même temps
2. **L'aperçu** est immédiat pour faciliter la vérification avant sauvegarde
3. **La modification** permet de changer l'image en uploadant un nouveau fichier ou en changeant l'URL
4. **Les images uploadées** sont conservées même si vous supprimez l'entrée de la base de données (nettoyage manuel nécessaire)

## Prochaines améliorations possibles

- Recadrage d'image avant upload
- Compression automatique des images
- Suppression automatique des anciennes images lors de la modification
- Glisser-déposer (drag & drop)
- Upload multiple pour la galerie
