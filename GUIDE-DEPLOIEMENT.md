# Guide de Déploiement - CMCI Belgique Website

## 📋 Vue d'ensemble

Ce guide décrit la procédure complète pour déployer des modifications du site CMCI Belgique sur le serveur VPS de production.

**Serveur Production :** 185.97.146.100  
**Frontend URL :** https://www.cmcibelgique.org  
**Backend URL :** https://api.cmcibelgique.org  
**Backend Port :** 5001  
**Frontend Port :** 3001  

---

## 🔧 Prérequis

- Accès SSH au serveur VPS (utilisateur `root`)
- Code local à jour et testé
- Node.js et npm installés localement (pour tests)
- Accès au repo Git (optionnel)

---

## 📝 Processus de Déploiement

### **1. TEST LOCAL (OBLIGATOIRE)**

Avant de déployer, TOUJOURS tester localement :

```bash
# Depuis le dossier local du projet
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website

# Test du frontend
cd src/frontend
npm run build

# Vérifier qu'il n'y a pas d'erreurs
# Si le build réussit, c'est OK ✅
```

---

### **2. DÉPLOIEMENT FRONTEND**

#### **Option A : Fichiers spécifiques modifiés**

Si vous avez modifié quelques composants/fichiers :

```bash
# Depuis le dossier local du projet
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website

# Copier les fichiers modifiés (exemple)
scp src/frontend/components/about.tsx root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/frontend/components/

scp src/frontend/components/newsletter.tsx root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/frontend/components/

# Pour plusieurs fichiers d'un même dossier
scp src/frontend/lib/translations/*.json root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/frontend/lib/translations/
```

#### **Option B : Rebuild complet du frontend**

Si beaucoup de modifications ou nouveau système ajouté :

```bash
# 1. Se connecter au VPS
ssh root@185.97.146.100

# 2. Aller dans le dossier frontend
cd /home/root/applications/cmci-belgique-website/src/frontend

# 3. Arrêter le frontend
pm2 stop cmci-frontend

# 4. Supprimer l'ancien build
rm -rf .next

# 5. Rebuild
npm run build

# 6. Redémarrer
pm2 restart cmci-frontend

# 7. Vérifier le status
pm2 list

# 8. Quitter SSH
exit
```

---

### **3. DÉPLOIEMENT BACKEND**

#### **Étape 1 : Copier les fichiers modifiés**

```bash
# Depuis le dossier local du projet
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website

# Copier des routes spécifiques
scp src/backend/routes/hero.routes.js root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/backend/routes/

# Ou plusieurs fichiers
scp src/backend/routes/{hero,events,gallery}.routes.js root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/backend/routes/

# Copier un modèle Prisma (si modifié)
scp src/backend/prisma/schema.prisma root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/backend/prisma/
```

#### **Étape 2 : Redémarrer le backend**

```bash
# Se connecter au VPS
ssh root@185.97.146.100

# Redémarrer le backend
pm2 restart cmci-backend

# Attendre 2-3 secondes et vérifier
sleep 3
pm2 list

# Vérifier les logs (optionnel)
pm2 logs cmci-backend --lines 10 --nostream

# Quitter SSH
exit
```

#### **Étape 3 : Migration base de données (si nécessaire)**

Si vous avez modifié le schema Prisma :

```bash
# Se connecter au VPS
ssh root@185.97.146.100

# Aller dans le dossier backend
cd /home/root/applications/cmci-belgique-website/src/backend

# Générer et appliquer la migration
npx prisma migrate dev --name nom_de_la_migration

# Ou appliquer en production
npx prisma migrate deploy

# Quitter SSH
exit
```

---

### **4. VÉRIFICATIONS POST-DÉPLOIEMENT**

#### **Test automatique**

```bash
# Test du frontend
curl -I https://www.cmcibelgique.org
# Doit retourner : HTTP/1.1 200 OK

# Test du backend
curl -I https://api.cmcibelgique.org/api/hero
# Doit retourner : HTTP/1.1 200 OK

# Test d'un endpoint spécifique
curl -s https://api.cmcibelgique.org/api/assemblies | jq 'length'
# Doit retourner le nombre d'assemblées
```

#### **Test manuel**

1. ✅ Ouvrir https://www.cmcibelgique.org dans le navigateur
2. ✅ Vider le cache (Ctrl+Shift+R ou Cmd+Shift+R)
3. ✅ Vérifier que la page charge correctement
4. ✅ Tester la navigation
5. ✅ Vérifier le sélecteur de langue (si applicable)
6. ✅ Tester l'admin : https://www.cmcibelgique.org/admin
7. ✅ Tester un upload d'image

---

### **5. GESTION DES PROBLÈMES**

#### **Frontend ne démarre pas**

```bash
ssh root@185.97.146.100
pm2 logs cmci-frontend --lines 20
# Lire les erreurs et corriger

# Si erreur de build
cd /home/root/applications/cmci-belgique-website/src/frontend
rm -rf .next
npm run build
pm2 restart cmci-frontend
```

#### **Backend ne démarre pas**

```bash
ssh root@185.97.146.100
pm2 logs cmci-backend --lines 20 --err
# Lire les erreurs

# Vérifier le port
netstat -tlnp | grep 5001
# Si occupé, tuer le processus ou redémarrer

pm2 restart cmci-backend
```

#### **Erreur CORS**

```bash
ssh root@185.97.146.100
# Redémarrer Nginx
systemctl restart nginx

# Vérifier Nginx
nginx -t
systemctl status nginx
```

#### **Base de données corrompue**

```bash
ssh root@185.97.146.100
cd /home/root/applications/cmci-belgique-website/src/backend

# Backup de la base
cp prisma/dev.db prisma/dev.db.backup

# Reset (ATTENTION : efface les données)
npx prisma migrate reset

# Ou réparer
npx prisma db push
```

---

### **6. ROLLBACK (RETOUR ARRIÈRE)**

Si le déploiement cause des problèmes :

```bash
ssh root@185.97.146.100

# Pour le frontend
cd /home/root/applications/cmci-belgique-website/src/frontend
git checkout HEAD~1 src/frontend/  # Si Git utilisé
# Ou restaurer manuellement les fichiers
pm2 restart cmci-frontend

# Pour le backend
pm2 restart cmci-backend
```

---

## 🔄 DÉPLOIEMENT RAPIDE (CHECKLIST)

### **Frontend modifié**

```bash
# 1. Test local
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website/src/frontend
npm run build

# 2. Copier fichiers
scp components/about.tsx root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/frontend/components/

# 3. Rebuild sur VPS
ssh root@185.97.146.100 "cd /home/root/applications/cmci-belgique-website/src/frontend && pm2 stop cmci-frontend && rm -rf .next && npm run build && pm2 restart cmci-frontend"

# 4. Vérifier
curl -I https://www.cmcibelgique.org
```

### **Backend modifié**

```bash
# 1. Copier fichiers
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website
scp src/backend/routes/hero.routes.js root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/backend/routes/

# 2. Redémarrer backend
ssh root@185.97.146.100 "pm2 restart cmci-backend"

# 3. Vérifier
curl -I https://api.cmcibelgique.org/api/hero
```

---

## 📊 COMMANDES UTILES

### **Status des services**

```bash
ssh root@185.97.146.100 "pm2 list"
```

### **Logs en temps réel**

```bash
# Frontend
ssh root@185.97.146.100 "pm2 logs cmci-frontend"

# Backend
ssh root@185.97.146.100 "pm2 logs cmci-backend"

# Sortir : Ctrl+C
```

### **Redémarrer tous les services**

```bash
ssh root@185.97.146.100 "pm2 restart all"
```

### **Vérifier espace disque**

```bash
ssh root@185.97.146.100 "df -h"
```

---

## ⚠️ PRÉCAUTIONS

1. **TOUJOURS tester localement avant de déployer**
2. **Faire un backup de la base de données avant les migrations**
3. **Déployer en dehors des heures de pointe (si possible)**
4. **Surveiller les logs après déploiement**
5. **Tester dans un navigateur privé (cache propre)**
6. **Garder une fenêtre SSH ouverte pendant le déploiement**
7. **Ne JAMAIS modifier directement sur le serveur sans backup**

---

## 🎯 EXEMPLES CONCRETS

### **Exemple 1 : Corriger une faute de frappe dans un composant**

```bash
# 1. Modifier localement le fichier
nano src/frontend/components/about.tsx

# 2. Tester
cd src/frontend && npm run build

# 3. Copier sur VPS
cd ../..
scp src/frontend/components/about.tsx root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/frontend/components/

# 4. Rebuild frontend
ssh root@185.97.146.100 "cd /home/root/applications/cmci-belgique-website/src/frontend && pm2 stop cmci-frontend && rm -rf .next && npm run build && pm2 restart cmci-frontend"

# 5. Tester
curl -I https://www.cmcibelgique.org
```

### **Exemple 2 : Augmenter limite upload backend**

```bash
# 1. Modifier localement
nano src/backend/routes/hero.routes.js
# Changer : limits: { fileSize: 5 * 1024 * 1024 }
# En : limits: { fileSize: 15 * 1024 * 1024 }

# 2. Copier sur VPS
scp src/backend/routes/hero.routes.js root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/backend/routes/

# 3. Redémarrer backend
ssh root@185.97.146.100 "pm2 restart cmci-backend"

# 4. Vérifier
ssh root@185.97.146.100 "pm2 logs cmci-backend --lines 5 --nostream"
```

### **Exemple 3 : Ajouter nouveau composant avec dépendances**

```bash
# 1. Installer dépendances localement
cd src/frontend
npm install nouvelle-lib

# 2. Tester build
npm run build

# 3. Copier le nouveau composant
cd ../..
scp src/frontend/components/NouveauComposant.tsx root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/frontend/components/

# 4. Installer dépendances sur VPS et rebuild
ssh root@185.97.146.100
cd /home/root/applications/cmci-belgique-website/src/frontend
npm install nouvelle-lib
pm2 stop cmci-frontend
rm -rf .next
npm run build
pm2 restart cmci-frontend
exit

# 5. Vérifier
curl -I https://www.cmcibelgique.org
```

---

## 🆘 CONTACTS D'URGENCE

- **Admin système :** root@185.97.146.100
- **Base de données :** `/home/root/applications/cmci-belgique-website/src/backend/prisma/dev.db`
- **Logs PM2 :** `/root/.pm2/logs/`
- **Nginx config :** `/etc/nginx/sites-available/cmcibelgique`
- **SSL certificats :** Expire le 5 mai 2026

---

**Dernière mise à jour :** 6 février 2026  
**Version guide :** 1.0
