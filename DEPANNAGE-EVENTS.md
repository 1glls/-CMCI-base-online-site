# 🔧 Dépannage - Événements et Images

## Problèmes identifiés et solutions

### 1. ✅ Configuration mise à jour
- Fichier `/src/frontend/.env.local` créé avec `NEXT_PUBLIC_API_URL`
- Logs de debug ajoutés dans le composant Events
- Configuration API centralisée dans `/src/frontend/lib/api.ts`

### 2. 🔄 Redémarrage nécessaire

Next.js a besoin d'un **redémarrage complet** pour prendre en compte les modifications.

#### Étapes de redémarrage :

**Terminal 1 - Backend** (déjà en cours) :
```bash
# Si le backend ne tourne pas :
cd src/backend
node server.js
```

**Terminal 2 - Frontend** (À REDÉMARRER) :
```bash
# 1. Arrêter le serveur actuel (Ctrl+C)
# 2. Nettoyer le cache Next.js
cd src/frontend
rm -rf .next

# 3. Redémarrer
npm run dev
```

### 3. 📱 Vérifications dans le navigateur

Après redémarrage, ouvrez `http://localhost:3000` et :

1. **Ouvrez la console (F12)** → Onglet Console
2. **Cherchez ces logs** :
   ```
   🔍 Fetching events from: http://localhost:5000/api/events
   📡 Response status: 200
   ✅ Events loaded: 4 events
   ```

3. **Si vous ne voyez PAS les événements** :
   - Rafraîchissez avec Ctrl+Shift+R (hard refresh)
   - Videz le cache : F12 → Network → "Disable cache"

### 4. 🖼️ Images - Vérification

Les images sont présentes dans `/src/frontend/public/images/` :
```bash
ls -lh src/frontend/public/images/event*.jpg
```

**Images disponibles** :
- `event-conference.jpg` (168K) ← utilisée comme fallback
- `event-prayer.jpg` (141K)
- `event-youth.jpg` (127K)

### 5. 🔗 Bouton "Prochains événements"

Le bouton dans le Hero utilise : `<Link href="#evenements">`

**Configuration** :
- ✅ L'ancre `id="evenements"` existe dans le composant Events
- ✅ Le scroll-behavior smooth est activé dans globals.css
- ✅ Le composant Events est bien importé dans page.tsx

**Si le scroll ne fonctionne pas** :
1. Vérifiez que la section Events s'affiche
2. Testez manuellement : Ajoutez `#evenements` dans l'URL
3. Rechargez complètement la page (Ctrl+Shift+R)

### 6. 🧪 Tests rapides

#### Test 1 : Backend fonctionne
```bash
curl http://localhost:5000/api/health
# Doit retourner: {"status":"OK","message":"CMCI Backend is running"}
```

#### Test 2 : Événements disponibles
```bash
curl http://localhost:5000/api/events | python3 -m json.tool | head -20
# Doit montrer 4 événements
```

#### Test 3 : Frontend accessible
```bash
curl -I http://localhost:3000
# Doit retourner: HTTP/1.1 200 OK
```

### 7. 🐛 Si les événements ne s'affichent toujours pas

**Console navigateur montre des erreurs CORS ?**
```
❌ Blocage requête CORS sur http://localhost:5000/api/events
```

→ **Solution** : Le backend n'est pas démarré ou bloqué
```bash
# Vérifier le backend
ps aux | grep "node server.js"

# Si absent, redémarrer
cd src/backend
node server.js
```

**Console montre : "0 events" ?**
```
✅ Events loaded: 0 events
```

→ **Solution** : Base de données vide
```bash
# Ajouter des événements de test
./otherthings/scripts/seed-events.sh
```

**Rien dans la console ?**
```
Aucun log visible
```

→ **Solution** : Next.js utilise une ancienne version en cache
```bash
cd src/frontend
rm -rf .next node_modules/.cache
npm run dev
```

### 8. 📝 Checklist complète

- [ ] Backend démarré sur port 5000
- [ ] Frontend redémarré après suppression de `.next`
- [ ] Cache navigateur vidé (Ctrl+Shift+R)
- [ ] Console ouverte pour voir les logs
- [ ] Événements visibles dans l'API : `curl http://localhost:5000/api/events`
- [ ] Section Events visible sur la page d'accueil
- [ ] Clic sur "Prochains événements" scroll vers la section
- [ ] Images d'événements affichées (ou image par défaut)

### 9. 🎯 Commandes de diagnostic

**Tout-en-un - Vérification système** :
```bash
#!/bin/bash
echo "=== DIAGNOSTIC COMPLET ==="

echo -e "\n1️⃣ Backend status:"
curl -s http://localhost:5000/api/health 2>/dev/null || echo "❌ Backend NOT running"

echo -e "\n2️⃣ Nombre d'événements:"
curl -s http://localhost:5000/api/events 2>/dev/null | python3 -c "import sys, json; print(len(json.load(sys.stdin)), 'events')" || echo "❌ Cannot fetch"

echo -e "\n3️⃣ Frontend status:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:3000 2>/dev/null || echo "❌ Frontend NOT running"

echo -e "\n4️⃣ Images présentes:"
ls -1 src/frontend/public/images/event*.jpg 2>/dev/null | wc -l | xargs echo "Images:"

echo -e "\n=== FIN DIAGNOSTIC ==="
```

Copiez ce script dans un fichier `diagnostic.sh`, rendez-le exécutable avec `chmod +x diagnostic.sh` et lancez-le.

---

## 🚀 Solution Rapide (TL;DR)

```bash
# Terminal 1 - Backend
cd src/backend && node server.js

# Terminal 2 - Frontend (nouveau terminal)
cd src/frontend
rm -rf .next
npm run dev

# Terminal 3 - Tester
curl http://localhost:5000/api/events
```

Puis ouvrez `http://localhost:3000` dans le navigateur et faites **Ctrl+Shift+R**.

---

**Date** : 2 février 2026
