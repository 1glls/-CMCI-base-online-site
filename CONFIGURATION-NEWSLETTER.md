# Configuration de la Newsletter

## 📧 Configuration Email

Le système de newsletter nécessite la configuration d'un service d'envoi d'emails. Deux options sont disponibles :

### Option 1 : Gmail (Recommandé pour les tests)

1. **Activer l'authentification à deux facteurs** sur votre compte Google :
   - Allez sur https://myaccount.google.com/security
   - Activez la validation en deux étapes

2. **Générer un mot de passe d'application** :
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Autre (nom personnalisé)"
   - Entrez "CMCI Newsletter"
   - Copiez le mot de passe généré (16 caractères sans espaces)

3. **Configurer le fichier .env** :
   ```env
   EMAIL_USER=votre-email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop  # Votre mot de passe d'application
   NEWSLETTER_FROM_NAME=CMCI Belgique
   NEWSLETTER_FROM_EMAIL=votre-email@gmail.com
   ```

### Option 2 : SMTP Générique (Recommandé pour la production)

Pour un serveur SMTP professionnel (ex: Hostinger, OVH, etc.) :

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contact@cmci-belgique.be
SMTP_PASSWORD=votre-mot-de-passe
NEWSLETTER_FROM_NAME=CMCI Belgique
NEWSLETTER_FROM_EMAIL=contact@cmci-belgique.be
```

## 🚀 Fonctionnalités

### 1. Envoi Automatique

Le système envoie automatiquement des newsletters selon ces plannings :

- **Newsletter hebdomadaire** : Tous les lundis à 9h00
  - Récapitulatif des événements à venir dans les 30 prochains jours

- **Rappels quotidiens** : Tous les jours à 8h00
  - Événements du jour et du lendemain

### 2. Envoi Manuel

Via l'interface admin (`/admin/newsletter`) :
- Sélectionner les événements à inclure
- Envoyer immédiatement à tous les abonnés actifs
- Voir le statut d'envoi en temps réel

### 3. Gestion des Abonnés

- Liste complète des abonnés avec leur statut
- Export CSV pour analyse externe
- Suppression d'abonnés
- Statistiques en temps réel

## 📝 Templates d'Email

Les emails sont envoyés en HTML avec :
- Logo CMCI
- Design responsive
- Informations complètes de chaque événement
- Liens de désabonnement

## 🔧 Démarrage

1. **Configurer les variables d'environnement** dans `src/backend/.env`

2. **Redémarrer le serveur backend** :
   ```bash
   cd src/backend
   npm start
   ```

3. **Vérifier l'initialisation** :
   ```
   🚀 Server running on port 5000
   📧 Newsletter cron jobs initialized
   ```

4. **Tester l'envoi** :
   - Aller sur http://localhost:3000/admin/newsletter
   - Sélectionner un événement
   - Cliquer sur "Envoyer"

## ⚠️ Troubleshooting

### Erreur : "Invalid login"
- Vérifiez que vous utilisez un mot de passe d'application (pas votre mot de passe Google)
- Vérifiez que l'authentification à deux facteurs est activée

### Erreur : "Connection timeout"
- Vérifiez vos paramètres SMTP (host, port, secure)
- Vérifiez que votre pare-feu autorise les connexions sortantes

### Les emails n'arrivent pas
- Vérifiez le dossier spam
- Vérifiez les logs du serveur backend
- Testez avec un email personnel d'abord

## 📊 Limites d'Envoi

Pour éviter d'être marqué comme spam :
- Batch de 10 emails avec pause de 1 seconde
- Maximum 500 emails par jour (Gmail gratuit)
- Utilisez un service SMTP professionnel pour plus de volume

## 🔐 Sécurité

- Ne jamais commit le fichier .env
- Utilisez des mots de passe d'application, pas des mots de passe principaux
- Activez l'authentification à deux facteurs
- En production, utilisez des variables d'environnement serveur
