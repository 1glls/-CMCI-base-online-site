# 🚀 Déploiement Rapide - CMCI Belgique

## ✅ Code Local Synchronisé

Tout le code local est **à jour** avec les dernières modifications :
- ✅ Système multilingue (FR/EN/NL)
- ✅ Limite upload 15 MB
- ✅ Stats dynamiques
- ✅ Corrections françaises

---

## 📝 Fichiers de Documentation

### **1. GUIDE-DEPLOIEMENT.md**
Guide complet avec toutes les commandes et procédures détaillées.

### **2. MODIFICATIONS-ACTUELLES.md**
Récapitulatif de toutes les modifications effectuées durant cette session.

### **3. deploy.sh**
Script automatisé pour déployer rapidement.

---

## 🔧 Utilisation du Script de Déploiement

### **Rendre le script exécutable (si nécessaire)**
```bash
chmod +x deploy.sh
```

### **Commandes disponibles**

#### **Déployer UNIQUEMENT le frontend**
```bash
./deploy.sh frontend
```

#### **Déployer UNIQUEMENT le backend**
```bash
./deploy.sh backend
```

#### **Déployer TOUT (frontend + backend)**
```bash
./deploy.sh all
```

#### **Voir les logs**
```bash
./deploy.sh logs
```

#### **Tester le build local**
```bash
./deploy.sh test
```

---

## 📋 Déploiement Manuel (Sans Script)

### **Option 1 : Frontend complet**

```bash
# 1. Test local
cd src/frontend
npm run build

# 2. Se connecter au VPS et rebuild
ssh root@185.97.146.100
cd /home/root/applications/cmci-belgique-website/src/frontend
pm2 stop cmci-frontend
rm -rf .next
npm run build
pm2 restart cmci-frontend
exit

# 3. Vérifier
curl -I https://www.cmcibelgique.org
```

### **Option 2 : Backend (routes modifiées)**

```bash
# 1. Copier les fichiers
cd /home/guillias/Bureau/CMCI-Bel/cmci-belgique-website
scp src/backend/routes/*.routes.js root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/backend/routes/

# 2. Redémarrer backend
ssh root@185.97.146.100 "pm2 restart cmci-backend"

# 3. Vérifier
curl -I https://api.cmcibelgique.org/api/hero
```

### **Option 3 : Fichiers spécifiques**

```bash
# Copier un composant
scp src/frontend/components/about.tsx root@185.97.146.100:/home/root/applications/cmci-belgique-website/src/frontend/components/

# Puis rebuild frontend (voir Option 1)
```

---

## 🔍 Vérifications Post-Déploiement

### **Tests automatiques**
```bash
# Frontend
curl -I https://www.cmcibelgique.org

# Backend
curl -I https://api.cmcibelgique.org/api/hero

# Test comptage assemblées
curl -s https://api.cmcibelgique.org/api/assemblies | jq 'length'
```

### **Tests manuels**
1. Ouvrir https://www.cmcibelgique.org
2. Vider le cache (Ctrl+Shift+R)
3. Tester le sélecteur de langue
4. Vérifier les stats dynamiques
5. Tester l'admin
6. Tester un upload

---

## 🆘 En cas de problème

### **Frontend ne charge pas**
```bash
ssh root@185.97.146.100
pm2 logs cmci-frontend --lines 20
```

### **Backend erreur 500**
```bash
ssh root@185.97.146.100
pm2 logs cmci-backend --lines 20 --err
```

### **Restart complet**
```bash
ssh root@185.97.146.100
pm2 restart all
systemctl restart nginx
```

---

## 📊 État Actuel du Serveur

### **Frontend**
- Port: 3001
- Status: ONLINE
- PID: 222651
- URL: https://www.cmcibelgique.org

### **Backend**
- Port: 5001
- Status: ONLINE
- PID: 222954
- URL: https://api.cmcibelgique.org

### **Base de données**
- Type: SQLite
- Path: `prisma/dev.db`
- Settings: 13
- Assemblées: 5
- Images galerie: 6

---

## 📦 Modifications Principales

### **Multilingue**
- FR (Français) - par défaut
- EN (English)
- NL (Nederlands)

### **Upload**
- Limite: 15 MB (Hero, Events, Gallery, Ministries, Testimonials)

### **Stats dynamiques**
- Assemblées: Comptées depuis la BD
- Années: Calculées automatiquement (2026 - 2011 = 15)

---

## 🎯 URLs Importantes

- **Site public:** https://www.cmcibelgique.org
- **Admin panel:** https://www.cmcibelgique.org/admin
- **API backend:** https://api.cmcibelgique.org
- **Credentials admin:** admin@cmcibelgique.org / CMCI2026@Admin

---

## 📞 Commandes Utiles

```bash
# Status services
ssh root@185.97.146.100 "pm2 list"

# Logs temps réel
ssh root@185.97.146.100 "pm2 logs cmci-frontend"
ssh root@185.97.146.100 "pm2 logs cmci-backend"

# Restart spécifique
ssh root@185.97.146.100 "pm2 restart cmci-frontend"
ssh root@185.97.146.100 "pm2 restart cmci-backend"

# Restart Nginx
ssh root@185.97.146.100 "systemctl restart nginx"

# Espace disque
ssh root@185.97.146.100 "df -h"
```

---

## ⚠️ Avertissements

1. **TOUJOURS** tester localement avant déployer
2. **FAIRE UN BACKUP** avant migration BD
3. **SURVEILLER LES LOGS** après déploiement
4. **TESTER EN PRIVÉ** (cache propre)
5. **GARDER SSH OUVERT** pendant déploiement

---

**Dernière mise à jour:** 6 février 2026  
**Status:** ✅ TOUT FONCTIONNEL
