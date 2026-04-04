# Guide Rapide - Déploiement VPS Hostinger

## 🚀 Déploiement en 30 minutes

### Prérequis
- ✅ VPS Hostinger actif (Ubuntu)
- ✅ Accès SSH (IP + identifiants)
- ✅ Nom de domaine configuré

---

## Option 1: Script Automatique (Recommandé)

### Depuis votre machine locale:

```bash
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website
chmod +x deploiement/hostinger/deploy-vps.sh
./deploiement/hostinger/deploy-vps.sh
```

Le script va vous demander:
- IP du VPS
- Utilisateur SSH
- Nom de domaine

Et automatiquement:
- 📦 Créer une archive du projet
- ⬆️ Uploader vers le VPS
- 🔧 Installer les dépendances
- 🏗️ Builder le frontend
- 🚀 Démarrer avec PM2

---

## Option 2: Manuel (Étape par étape)

### 1. Sur VOTRE MACHINE LOCALE

```bash
# Aller dans le projet
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website

# Créer l'archive
tar --exclude='node_modules' --exclude='.git' --exclude='src/backend/prisma/dev.db' \
    -czf cmci-deploy.tar.gz .

# Uploader vers le VPS
scp cmci-deploy.tar.gz UTILISATEUR@IP_VPS:/tmp/
```

### 2. Sur le VPS (SSH)

```bash
# Se connecter
ssh UTILISATEUR@IP_VPS

# Installer Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installer pnpm et PM2
sudo npm install -g pnpm pm2

# Installer Nginx
sudo apt install -y nginx

# Extraire le projet
mkdir -p ~/applications/cmci-belgique-website
cd ~/applications/cmci-belgique-website
tar -xzf /tmp/cmci-deploy.tar.gz

# Backend
cd src/backend
pnpm install --prod
mkdir -p uploads/events uploads/gallery uploads/testimonials uploads/ministries
nano .env  # Configurer les variables

# Initialiser la DB
npx prisma generate
npx prisma migrate deploy

# Frontend
cd ../frontend
pnpm install
nano .env.production  # NEXT_PUBLIC_API_URL
pnpm run build

# Démarrer avec PM2
cd ../backend
pm2 start server.js --name cmci-backend

cd ../frontend
pm2 start pnpm --name cmci-frontend -- start

pm2 save
pm2 startup  # Copier/coller la commande affichée
```

### 3. Configurer Nginx

```bash
sudo nano /etc/nginx/sites-available/cmci
```

Coller:
```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.votre-domaine.com;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        client_max_body_size 10M;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/cmci /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL avec Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com -d api.votre-domaine.com
```

### 5. Créer le premier admin

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cmci.be","password":"VotreMotDePasse","name":"Admin"}'
```

---

## Vérifications

```bash
# Status des applications
pm2 status

# Logs
pm2 logs

# Tester le backend
curl http://localhost:5000/health

# Tester le frontend
curl http://localhost:3000
```

---

## Configuration DNS (Hostinger Panel)

Dans votre panneau Hostinger → Domaines → DNS:

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| A | @ | IP_VPS | 14400 |
| A | www | IP_VPS | 14400 |
| A | api | IP_VPS | 14400 |

Attendre 5-30 minutes pour la propagation.

---

## Commandes Utiles

```bash
# Redémarrer
pm2 restart all

# Voir les logs
pm2 logs
pm2 logs cmci-backend

# Status du serveur
pm2 monit

# Mettre à jour le code
cd ~/applications/cmci-belgique-website
git pull
cd src/backend && pnpm install --prod && pm2 restart cmci-backend
cd ../frontend && pnpm install && pnpm run build && pm2 restart cmci-frontend
```

---

## URLs Finales

- 🌐 Site: https://votre-domaine.com
- 👨‍💼 Admin: https://votre-domaine.com/admin
- 🔧 API: https://api.votre-domaine.com

---

## Support

Pour le guide détaillé: [README.md](./README.md)

Problèmes communs:
- **502 Bad Gateway**: `pm2 restart all`
- **Site inaccessible**: Vérifier DNS et firewall
- **Erreur DB**: Vérifier `.env` et lancer `npx prisma migrate deploy`
