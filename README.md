# CMCI Belgique - Site Web Officiel

Site de la Communauté Missionnaire Chrétienne Internationale (CMCI) en Belgique : <https://www.cmcibelgique.org>

Site public en trois langues (FR / EN / NL), charte graphique « Nuit & or » (mode sombre et mode clair), et
interface d'administration qui alimente tout le contenu. Rattaché au site mère de la CMCI internationale :
<https://cmfinternational.org>

## 🏗️ Architecture

```
cmci-belgique-website/
├── src/
│   ├── frontend/                 # Next.js 16 (React 19 + TypeScript + Tailwind CSS 4)
│   │   ├── app/                  # Pages (App Router) : site public + /admin
│   │   ├── components/
│   │   │   ├── site/             # Briques communes : en-tête, pied de page, animations, bandeau…
│   │   │   ├── home/             # Sections de l'accueil et de « Mieux nous connaître »
│   │   │   ├── gallery/          # Page Galerie (vues « Photo par photo » et « Catalogue »)
│   │   │   └── ui/               # Composants de base (Radix UI), surtout pour l'admin
│   │   ├── lib/                  # Accès API, SEO, dates, liens CMFI, traductions
│   │   ├── public/               # Logos, favicons, images fixes
│   │   └── build-prod.sh         # Build + redémarrage en production (VPS)
│   │
│   └── backend/                  # API REST Express + Prisma (SQLite)
│       ├── routes/               # Une route par type de contenu
│       ├── services/             # Newsletter (cron), traduction automatique…
│       ├── middleware/           # Protection JWT des routes admin
│       ├── prisma/               # schema.prisma + migrations
│       └── uploads/              # Images envoyées depuis l'admin
│
├── deploiement/                  # Guides local et VPS Hostinger
└── otherthings/                  # Anciennes docs, scripts (make_logo.py, make_icons.py…)
```

## 🌐 Pages publiques

| Adresse | Contenu |
| --- | --- |
| `/` | Accueil : hero (message ou diaporama) + livres mis en avant, À la une, aperçu « Mieux nous connaître », Notre identité, Ministères, Agenda (frise horizontale), Assemblées (carte), aperçu Galerie, Contact |
| `/mieux-nous-connaitre` | Qui sommes-nous, Notre fondateur (Prof. Z. T. Fomum), Vision, Témoignages, Contact |
| `/temps-forts` | Grands rendez-vous avec compte à rebours et infos pratiques, bande d'images défilantes |
| `/galerie` | Deux vues au choix : « Photo par photo » et « Catalogue » (`?vue=catalogue`) |
| `/livres`, `/livres/[id]` | Livres et tracts, fiche de chaque livre |
| `/t/[slug]` | Lecture d'un tract |
| `/formulaires/[slug]` | Formulaires d'inscription (apparence d'origine, hors charte) |
| `/preview` | Page d'essai de styles, exclue de Google |

Menu (pas de nouvelle entrée de premier niveau : les nouvelles pages vont dans les sous-menus) :
**Accueil** · **Découvrir** (Notre identité, Ministères) · **Vie de l'église** (Agenda, Temps forts, Assemblées,
Galerie) · **Publications** · **Mieux nous connaître**.

## 🔐 Administration (`/admin`)

Chaque rubrique de l'admin alimente une partie précise du site :

| Rubrique admin | Où ça apparaît sur le site |
| --- | --- |
| Hero | Diaporama du haut de l'accueil (mode « Diaporama + livres ») |
| Livres (bouton ✦, 8 max, ordre réglable) | Éventail de livres du hero |
| Livres / Tracts / Catégories | `/livres`, `/livres/[id]`, `/t/[slug]` |
| Événements (case « À la une ») | « À la une » (3 max mis en avant) et Agenda de l'accueil |
| Comptes à rebours | Bandeau animé en haut de toutes les pages + grand bloc sur `/temps-forts` |
| Ministères | Section Ministères de l'accueil |
| Assemblées | Carte et liste des assemblées |
| Galerie | Aperçu sur l'accueil, `/galerie`, images défilantes de `/temps-forts` |
| Témoignages (avec photo facultative) | `/mieux-nous-connaitre#temoignages` (photo fondue, ou initiale si pas de photo) |
| Paramètres | Téléphone, e-mail, réseaux sociaux, mode du haut de l'accueil (« Message + livres » / « Diaporama + livres ») |
| Newsletter, Formulaires, Traductions, Réseaux sociaux, Sauvegarde | Fonctions associées |

Le site relit l'admin automatiquement : environ **1 minute** pour l'accueil et Temps forts, **5 minutes** pour les
autres pages. Pas besoin de redéployer pour changer du contenu.

### Premier compte admin

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cmci.be", "password": "votre_mot_de_passe", "name": "Admin CMCI"}'
```

Voir aussi `CREER-ADMIN.txt`.

## 🎨 Charte « Nuit & or »

- **Couleurs** (variables CSS dans `src/frontend/app/globals.css`) : `--nuit` (noir), `--ivoire` (blanc),
  `--or` / `--or-clair` (or vif), `--rouge` (rouge vif), à savoir le noir, l'or et le rouge belges sur blanc. Le mode clair
  redéfinit ces variables sous `:root[data-theme="light"]` ; bouton soleil/lune dans l'en-tête (`next-themes`).
- **Nom de Jésus** : toutes ses formes s'affichent en rouge, y compris dans les textes saisis dans l'admin
  (composant `Rich`, `components/site/rich-text.tsx`).
- **Pas de cartes ni de cadres** : les images sont fondues dans le fond (classes `.fondu`, `.fondu-bas`,
  `.fondu-vers-gauche`, `.fondu-vers-droite`, `.fondu-fond`, basées sur `mask-image`).
- **Animations** : bibliothèque `motion` (`components/site/motion-kit.tsx`, `section-transition.tsx`). Elles
  respectent le réglage « réduire les animations » du système.
- **Polices** : Cormorant Garamond (titres), Cinzel (petites capitales, via `@fontsource/cinzel`).
- **Logos** : `public/cmci-logo-dark.png` et `cmci-logo-light.png` (un par thème) ; favicons `favicon.ico`,
  `icon.png`, `apple-icon.png`, générés par `otherthings/make_logo.py` et `otherthings/make_icons.py`.
- **Liens vers le site mère** : toutes les adresses cmfinternational.org sont dans `src/frontend/lib/cmfi.ts`.
- **Textes** : `src/frontend/lib/translations/{fr,en,nl}.json` (les textes de la refonte sont sous `home2.*`).

## 🔎 Référencement (SEO)

- Chaque page a son titre, sa description, son adresse officielle (canonical) et son aperçu de partage
  (`generateMetadata` dans chaque `page.tsx`), avec un seul `h1`.
- Les pages sont rendues côté serveur : Google lit tout le texte sans exécuter JavaScript.
- `app/sitemap.ts` génère `/sitemap.xml` (pages + livres + tracts) ; `app/robots.ts` exclut `/admin` et `/preview`.
- Données structurées « Church » (JSON-LD) : `lib/church-jsonld.tsx`.
- Après chaque grosse modification : renvoyer le sitemap dans Google Search Console et demander l'indexation des
  pages modifiées.
- Seul le français est indexé (le changement de langue se fait dans le navigateur, sans adresse dédiée).

## 🚀 Développement local

Prérequis : Node.js 20+, npm.

```bash
# Backend (port 5000)
cd src/backend
npm install
cp .env.example .env          # DATABASE_URL="file:./dev.db", JWT_SECRET=…
npx prisma migrate deploy     # toujours lancer Prisma depuis src/backend
npx prisma generate
npm run dev

# Frontend (dans un 2e terminal)
cd src/frontend
npm install
npx next dev -p 3005          # http://localhost:3005 (le port 3000 peut être occupé)
```

Le frontend lit l'adresse de l'API dans `NEXT_PUBLIC_API_URL` (`src/frontend/.env.local`, par défaut
`http://localhost:5000`).

Si le style ne se met pas à jour en local : arrêter `next dev`, supprimer `src/frontend/.next`, relancer.

## 🌍 Mise en production (VPS)

Backend et frontend tournent sous **pm2** (`cmci-backend`, `cmci-frontend`) derrière **nginx** ;
l'API est servie sur <https://api.cmcibelgique.org>.

```bash
cd /home/root/applications/cmci-belgique-website
git pull

cd src/backend
npx prisma migrate deploy     # si le schéma a changé
npx prisma generate           # obligatoire après migrate deploy (le client n'est pas régénéré sinon)
pm2 restart cmci-backend      # si le backend a changé

cd ../frontend
npm install                   # si des dépendances ont changé
./build-prod.sh               # build propre + redémarrage de cmci-frontend
```

Toujours mettre à jour le **backend avant le frontend** : le build lit les données de l'API.

Installation complète d'un nouveau serveur : `deploiement/hostinger/README.md`.

## 📡 API (préfixe `/api`)

Lecture publique, écriture réservée à l'admin (jeton JWT) :

| Route | Contenu |
| --- | --- |
| `auth` | Connexion / création d'admin |
| `hero` | Diapositives du hero |
| `books` (+ `books/hero`), `tracts`, `categories` | Publications ; `books/hero` = livres mis en avant |
| `events` | Événements |
| `countdowns` | Comptes à rebours (bandeau + Temps forts) |
| `ministries`, `assemblies` | Ministères, assemblées |
| `gallery`, `testimonials` | Galerie, témoignages |
| `settings` | Paramètres du site (`hero_mode` : `livres` ou `diaporama`) |
| `newsletter`, `forms`, `translations`, `social-media`, `backup` | Fonctions associées |

## 🔧 Technologies

- **Frontend** : Next.js 16 (App Router, rendu serveur + régénération périodique), React 19, TypeScript,
  Tailwind CSS 4, `motion` (animations), `next-themes` (mode clair/sombre), Radix UI, Lucide (icônes), Leaflet (carte).
- **Backend** : Express, Prisma 6 + SQLite, JWT + bcryptjs, Multer (images), node-cron (newsletter).
- **Hébergement** : VPS Hostinger, pm2, nginx, Let's Encrypt.

## 🔒 Sécurité

- Authentification JWT, mots de passe hachés (bcrypt), routes admin protégées par middleware.
- Secrets uniquement dans les fichiers `.env` (jamais dans Git).
- Sauvegarde régulière de la base SQLite (`src/backend/prisma/*.db`) et du dossier `uploads/`.

## 📝 Licence

Propriété de CMCI Belgique
