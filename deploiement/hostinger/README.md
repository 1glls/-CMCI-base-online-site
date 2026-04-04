# CMCI Belgique - Déploiement Hostinger VPS

## Guide complet de déploiement sur VPS Hostinger

Ce guide vous accompagne étape par étape pour déployer le site CMCI Belgique sur un VPS Hostinger avec Ubuntu.

---

## 📋 ÉTAPE 1: Prérequis

### Ce dont vous avez besoin:
- ✅ Un VPS Hostinger actif (Ubuntu 20.04/22.04 recommandé)
- ✅ Accès SSH au VPS (IP, username, password)
- ✅ Un nom de domaine pointant vers l'IP du VPS
- ✅ Accès au panneau Hostinger pour gérer le DNS

### Informations à préparer:
```
IP du VPS: _________________
Username SSH: root ou _________________
Password SSH: _________________
Domaine: cmci.be (ou votre domaine)
```

---

## 🔧 ÉTAPE 2: Connexion initiale au VPS

### 2.1 Se connecter via SSH
```bash
ssh root@VOTRE_IP_VPS
# Entrez votre mot de passe quand demandé
```

### 2.2 Mettre à jour le système
```bash
apt update && apt upgrade -y
```

### 2.3 Créer un utilisateur non-root (sécurité)
```bash
# Créer l'utilisateur
adduser cmci
# Lui donner les droits sudo
usermod -aG sudo cmci
# Se connecter avec ce nouvel utilisateur
su - cmci
```

---

## 📦 ÉTAPE 3: Installer les dépendances

### 3.1 Installer Node.js 20.x
```bash
# Ajouter le repository NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Installer Node.js
sudo apt install -y nodejs

# Vérifier l'installation
node --version  # Devrait afficher v20.x.x
npm --version   # Devrait afficher 10.x.x
```

### 3.2 Installer pnpm (gestionnaire de packages)
```bash
sudo npm install -g pnpm
pnpm --version
```

### 3.3 Installer Git
```bash
sudo apt install -y git
git --version
```

### 3.4 Installer Nginx (serveur web)
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Vérifier que Nginx fonctionne
sudo systemctl status nginx
```

### 3.5 Installer PM2 (gestionnaire de processus)
```bash
sudo npm install -g pm2
pm2 --version
```

---

## 🗄️ ÉTAPE 4: Configuration de la base de données

### Option A: Utiliser SQLite (Plus simple pour commencer)
```bash
# Aucune installation nécessaire, SQLite est intégré
# Le fichier dev.db sera créé automatiquement
```

### Option B: Installer PostgreSQL (Production recommandée)
```bash
# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Démarrer PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer la base de données
sudo -u postgres psql

# Dans psql:
CREATE DATABASE cmci_belgique;
CREATE USER cmci_user WITH PASSWORD 'MOT_DE_PASSE_SECURISE';
GRANT ALL PRIVILEGES ON DATABASE cmci_belgique TO cmci_user;
\q
```

---

## 📁 ÉTAPE 5: Déployer le code

### 5.1 Créer le répertoire du projet
```bash
cd ~
mkdir -p /home/cmci/applications
cd /home/cmci/applications
```

### 5.2 Option A: Cloner depuis Git (recommandé)
```bash
# Si votre code est sur GitHub/GitLab
git clone https://github.com/VOTRE_USERNAME/cmci-belgique-website.git
cd cmci-belgique-website
```

### 5.2 Option B: Uploader depuis votre machine locale
```bash
# Sur VOTRE MACHINE LOCALE (pas le VPS):
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website

# Créer une archive (exclure node_modules)
tar --exclude='node_modules' --exclude='.git' --exclude='src/backend/prisma/dev.db' \
    -czf cmci-belgique.tar.gz .

# Uploader vers le VPS
scp cmci-belgique.tar.gz cmci@VOTRE_IP_VPS:/home/cmci/applications/

# RETOUR SUR LE VPS:
cd /home/cmci/applications
tar -xzf cmci-belgique.tar.gz -C cmci-belgique-website
cd cmci-belgique-website
```

---

## ⚙️ ÉTAPE 6: Configuration Backend

### 6.1 Installer les dépendances backend
```bash
cd /home/cmci/applications/cmci-belgique-website/src/backend
pnpm install --prod
```

### 6.2 Créer le fichier .env
```bash
nano .env
```

Copier ce contenu (ajuster selon vos besoins):
```env
# Base de données - OPTION 1: SQLite (Simple)
DATABASE_URL="file:./prisma/dev.db"

# Base de données - OPTION 2: PostgreSQL (Production)
# DATABASE_URL="postgresql://cmci_user:MOT_DE_PASSE@localhost:5432/cmci_belgique"

# Sécurité
JWT_SECRET="CHANGEZ_CE_SECRET_AVEC_UNE_CHAINE_ALEATOIRE_TRES_LONGUE_ET_SECURISEE"
PORT=5000
NODE_ENV=production

# Email (Newsletter)
EMAIL_PROVIDER=gmail
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre_app_password_gmail

# Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

Sauvegarder: `Ctrl+O`, `Entrée`, `Ctrl+X`

### 6.3 Initialiser la base de données
```bash
# Générer Prisma Client
npx prisma generate

# Créer les tables
npx prisma migrate deploy

# OU si vous utilisez SQLite et voulez reset:
# npx prisma migrate dev --name init
```

### 6.4 Créer les dossiers d'upload
```bash
mkdir -p uploads/events uploads/gallery uploads/testimonials uploads/ministries
chmod -R 755 uploads
```

### 6.5 Créer le premier admin
```bash
# Démarrer temporairement le backend
node server.js &
SERVER_PID=$!

# Attendre 3 secondes
sleep 3

# Créer l'admin
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@cmci.be",
    "password":"MotDePasseSecurise123!",
    "name":"Administrateur CMCI"
  }'

# Stopper le serveur temporaire
kill $SERVER_PID
```

---

## 🎨 ÉTAPE 7: Configuration Frontend

### 7.1 Installer les dépendances frontend
```bash
cd /home/cmci/applications/cmci-belgique-website/src/frontend
pnpm install
```

### 7.2 Créer le fichier .env.production
```bash
nano .env.production
```

Ajouter:
```env
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
# OU si vous utilisez le même domaine:
# NEXT_PUBLIC_API_URL=https://votre-domaine.com/api
```

### 7.3 Build de production
```bash
pnpm run build
```

---

## 🚀 ÉTAPE 8: Démarrer avec PM2

### 8.1 Démarrer le Backend
```bash
cd /home/cmci/applications/cmci-belgique-website/src/backend

pm2 start server.js --name "cmci-backend" --time
pm2 save
```

### 8.2 Démarrer le Frontend
```bash
cd /home/cmci/applications/cmci-belgique-website/src/frontend

pm2 start pnpm --name "cmci-frontend" -- start
pm2 save
```

### 8.3 Configurer PM2 pour démarrer au boot
```bash
pm2 startup
# Copier et exécuter la commande affichée
pm2 save
```

### 8.4 Vérifier que tout fonctionne
```bash
pm2 status
pm2 logs cmci-backend --lines 50
pm2 logs cmci-frontend --lines 50
```

---

## 🌐 ÉTAPE 9: Configuration Nginx

### 9.1 Créer la configuration Nginx
```bash
sudo nano /etc/nginx/sites-available/cmci-belgique
```

Coller cette configuration:
```nginx
# Frontend
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Augmenter la taille max pour uploads
        client_max_body_size 10M;
    }
}
```

**Remplacer** `votre-domaine.com` par votre vrai domaine !

### 9.2 Activer la configuration
```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/cmci-belgique /etc/nginx/sites-enabled/

# Supprimer la config par défaut
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 🔒 ÉTAPE 10: Configurer SSL (HTTPS)

### 10.1 Installer Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 10.2 Obtenir les certificats SSL
```bash
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com -d api.votre-domaine.com
```

Suivez les instructions:
- Entrez votre email
- Acceptez les termes
- Choisissez "Redirect" pour forcer HTTPS

### 10.3 Tester le renouvellement automatique
```bash
sudo certbot renew --dry-run
```

---

## 🎯 ÉTAPE 11: Configuration DNS (Hostinger)

### Dans le panneau Hostinger:

1. **Allez dans** "Domaines" → Votre domaine → "DNS / Serveurs de noms"

2. **Ajoutez ces enregistrements**:

```
Type    Nom         Valeur                  TTL
A       @           VOTRE_IP_VPS            14400
A       www         VOTRE_IP_VPS            14400
A       api         VOTRE_IP_VPS            14400
```

3. **Attendez** la propagation DNS (peut prendre 5-30 minutes)

4. **Testez** en visitant:
   - http://votre-domaine.com
   - https://votre-domaine.com
   - https://api.votre-domaine.com/health

---

## ✅ ÉTAPE 12: Vérifications finales

---

## ✅ ÉTAPE 12: Vérifications finales

### 12.1 Vérifier les services
```bash
# Status de PM2
pm2 status

# Logs du backend
pm2 logs cmci-backend --lines 20

# Logs du frontend
pm2 logs cmci-frontend --lines 20

# Status de Nginx
sudo systemctl status nginx

# Tester les endpoints
curl http://localhost:5000/health
curl http://localhost:3000
```

### 12.2 Vérifier le site
Ouvrez votre navigateur:
- ✅ Frontend: https://votre-domaine.com
- ✅ Backend API: https://api.votre-domaine.com/health
- ✅ Admin: https://votre-domaine.com/admin

### 12.3 Tester l'admin
1. Allez sur https://votre-domaine.com/admin
2. Connectez-vous avec les identifiants créés à l'étape 6.5
3. Vérifiez que vous pouvez accéder au dashboard

---

## 🔥 ÉTAPE 13: Peupler la base de données (Optionnel)

Si vous voulez ajouter du contenu initial:

```bash
cd /home/cmci/applications/cmci-belgique-website/otherthings/scripts

# Rendre les scripts exécutables
chmod +x *.sh

# Ajouter des assemblées
./seed-settings.sh

# Ajouter des événements
./seed-gallery.sh

# Ajouter des témoignages
./seed-testimonials.sh

# Ajouter des images de ministères
cd ../../
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateMinistries() {
  const ministries = await prisma.ministry.findMany({ orderBy: { order: 'asc' } });
  const images = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
    'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=800',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800'
  ];
  for (let i = 0; i < ministries.length; i++) {
    await prisma.ministry.update({
      where: { id: ministries[i].id },
      data: { image: images[i] }
    });
  }
  await prisma.\$disconnect();
  console.log('✅ Images des ministères mises à jour');
}
updateMinistries();
"
```

---

## 🛠️ Commandes utiles de maintenance

### Redémarrer les services
```bash
# Redémarrer le backend
pm2 restart cmci-backend

# Redémarrer le frontend
pm2 restart cmci-frontend

# Redémarrer Nginx
sudo systemctl restart nginx

# Tout redémarrer
pm2 restart all
```

### Voir les logs
```bash
# Logs en temps réel
pm2 logs

# Logs d'une app spécifique
pm2 logs cmci-backend
pm2 logs cmci-frontend

# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Mettre à jour le code
```bash
cd /home/cmci/applications/cmci-belgique-website

# Pull les dernières modifications
git pull origin main

# Backend
cd src/backend
pnpm install --prod
npx prisma migrate deploy
npx prisma generate
pm2 restart cmci-backend

# Frontend
cd ../frontend
pnpm install
pnpm run build
pm2 restart cmci-frontend
```

### Surveiller les ressources
```bash
# CPU et RAM
pm2 monit

# Espace disque
df -h

# Processus
htop
```

---

## 🔐 Sécurité - IMPORTANT !

### Firewall (UFW)
```bash
# Installer UFW
sudo apt install -y ufw

# Configurer les règles
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Activer le firewall
sudo ufw enable

# Vérifier le status
sudo ufw status
```

### Fail2Ban (Protection contre les attaques)
```bash
# Installer Fail2Ban
sudo apt install -y fail2ban

# Créer une configuration
sudo nano /etc/fail2ban/jail.local
```

Ajouter:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
```

```bash
# Démarrer Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### Désactiver le login root SSH
```bash
sudo nano /etc/ssh/sshd_config

# Changer cette ligne:
PermitRootLogin no

# Redémarrer SSH
sudo systemctl restart ssh
```

---

## 💾 Backups automatiques

### Script de backup
```bash
# Créer le dossier backups
mkdir -p /home/cmci/backups

# Créer le script
nano /home/cmci/backups/backup.sh
```

Contenu du script:
```bash
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/cmci/backups"
APP_DIR="/home/cmci/applications/cmci-belgique-website"

# Créer le dossier du jour
mkdir -p $BACKUP_DIR/$DATE

# Backup base de données SQLite
if [ -f "$APP_DIR/src/backend/prisma/dev.db" ]; then
    cp $APP_DIR/src/backend/prisma/dev.db $BACKUP_DIR/$DATE/
fi

# Backup uploads
tar -czf $BACKUP_DIR/$DATE/uploads.tar.gz -C $APP_DIR/src/backend uploads/

# Backup .env files
cp $APP_DIR/src/backend/.env $BACKUP_DIR/$DATE/backend.env
cp $APP_DIR/src/frontend/.env.production $BACKUP_DIR/$DATE/frontend.env

# Supprimer les backups de plus de 7 jours
find $BACKUP_DIR -maxdepth 1 -type d -mtime +7 -exec rm -rf {} \;

echo "✅ Backup terminé: $BACKUP_DIR/$DATE"
```

```bash
# Rendre exécutable
chmod +x /home/cmci/backups/backup.sh

# Tester
/home/cmci/backups/backup.sh
```

### Automatiser avec Cron
```bash
crontab -e

# Ajouter cette ligne (backup quotidien à 3h du matin):
0 3 * * * /home/cmci/backups/backup.sh >> /home/cmci/backups/backup.log 2>&1
```

---

## 📊 Monitoring (Optionnel mais recommandé)

### Installer Netdata
```bash
# Installation en une ligne
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Configurer Nginx pour Netdata
sudo nano /etc/nginx/sites-available/netdata
```

```nginx
server {
    listen 80;
    server_name monitoring.votre-domaine.com;

    location / {
        proxy_pass http://localhost:19999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/netdata /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtenir SSL pour le monitoring
sudo certbot --nginx -d monitoring.votre-domaine.com
```

---

## 🚨 Troubleshooting

### Le site ne charge pas
```bash
# Vérifier PM2
pm2 status
pm2 logs

# Vérifier Nginx
sudo nginx -t
sudo systemctl status nginx

# Vérifier les ports
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :5000
```

### Erreur 502 Bad Gateway
```bash
# Le backend ne répond pas
pm2 restart cmci-backend
pm2 logs cmci-backend

# Vérifier la connexion DB
cd /home/cmci/applications/cmci-belgique-website/src/backend
npx prisma studio  # Interface web pour voir la DB
```

### Problème de permissions
```bash
# Réparer les permissions uploads
cd /home/cmci/applications/cmci-belgique-website/src/backend
sudo chown -R cmci:cmci uploads/
chmod -R 755 uploads/
```

### Espace disque plein
```bash
# Vérifier l'espace
df -h

# Nettoyer les logs PM2
pm2 flush

# Nettoyer les vieux backups
find /home/cmci/backups -type d -mtime +7 -exec rm -rf {} \;

# Nettoyer apt
sudo apt autoremove
sudo apt clean
```

---

## 📞 Support

Si vous rencontrez des problèmes:

1. **Vérifiez les logs**: `pm2 logs`
2. **Vérifiez Nginx**: `sudo nginx -t`
3. **Redémarrez les services**: `pm2 restart all && sudo systemctl reload nginx`
4. **Consultez la documentation**: [Hostinger VPS](https://www.hostinger.com/tutorials/vps)

---

## 🎉 Félicitations !

Votre site CMCI Belgique est maintenant en ligne ! 🚀

**URLs importantes:**
- 🌐 Site public: https://votre-domaine.com
- 👨‍💼 Administration: https://votre-domaine.com/admin
- 🔧 API: https://api.votre-domaine.com
- 📊 Monitoring: https://monitoring.votre-domaine.com (si configuré)

**Prochaines étapes:**
1. Uploader le logo et les images
2. Configurer les paramètres dans l'admin
3. Ajouter du contenu (événements, témoignages, etc.)
4. Tester l'envoi d'emails (newsletter)
5. Configurer Google Analytics (optionnel)

---

## 📝 Checklist finale

- [ ] VPS accessible via SSH
- [ ] Node.js 20.x installé
- [ ] Base de données configurée
- [ ] Code déployé et dépendances installées
- [ ] Variables d'environnement configurées
- [ ] PM2 démarre les applications
- [ ] Nginx configuré et fonctionnel
- [ ] SSL/HTTPS activé avec Certbot
- [ ] DNS pointant vers le VPS
- [ ] Firewall (UFW) activé
- [ ] Fail2Ban configuré
- [ ] Backups automatiques configurés
- [ ] Premier admin créé
- [ ] Site accessible publiquement
- [ ] Admin accessible et fonctionnel

---

**Bonne chance avec votre déploiement ! 🙏**
