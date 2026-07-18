# 📊 Synthèse du projet — CMCI Belgique

> **Mise à jour : 18 juillet 2026.** Ce document décrit l'état **réel du code** vérifié dans le dépôt.
> Il remplace la version de février 2026, qui décrivait une étape antérieure du projet et contenait
> plusieurs informations devenues fausses (voir § 9).
>
> Document complémentaire : [`ETAT-DES-LIEUX.md`](./ETAT-DES-LIEUX.md) (analyse du 8 juillet 2026, toujours valide).

---

## 1. Architecture

Monorepo à deux applications sous `src/` :

```
cmci-belgique-website/
├── src/
│   ├── frontend/         Next.js 16 — site public + panneau admin
│   └── backend/          Express 4 — API REST, uploads, emails, cron
├── deploiement/          Guides local/ et hostinger/
└── otherthings/          docs/ · scripts/ · tests/
```

| Bloc | Stack | Port dev | Port prod (VPS) |
|------|-------|----------|-----------------|
| Frontend | Next.js 16.1, React 19.2, TypeScript, Tailwind 4, Radix UI, Leaflet | 3000 | 3001 |
| Backend | Express 4.21, Prisma 6.2, **SQLite**, JWT, Multer, Sharp, Nodemailer, node-cron | 5000 | 5001 |

**Production** : `https://www.cmcibelgique.org` (front) · `https://api.cmcibelgique.org` (API).
Hébergement VPS `185.97.146.100`, géré par **PM2** + **Nginx** (reverse proxy, SSL).

---

## 2. Backend — `src/backend`

### Routes montées (11 groupes + `/api/health`)

Toutes déclarées dans [`server.js`](../../src/backend/server.js) :

| Route | Rôle | Statut |
|-------|------|--------|
| `/api/auth` | Authentification JWT | ✅ actif |
| `/api/events` | CRUD événements | ✅ actif |
| `/api/hero` | CRUD slides du carrousel | ✅ actif |
| `/api/testimonials` | CRUD témoignages | ✅ actif |
| `/api/gallery` | CRUD galerie | ✅ actif |
| `/api/settings` | Paramètres du site | ✅ actif |
| `/api/newsletter` | Abonnements + envois | ✅ actif |
| `/api/assemblies` | CRUD assemblées | ✅ actif |
| `/api/ministries` | CRUD ministères | ✅ actif |
| `/api/social-media` | Réseaux sociaux + validation | 🟡 codé, **jamais alimenté** |
| `/api/forms` | Formulaires dynamiques + Google Sheets | 🟡 codé, **jamais alimenté** |

### Services (4)

- `email.service.js` — Nodemailer, bascule automatique Gmail / SMTP selon les variables présentes.
- `newsletter-cron.service.js` — envois planifiés via `node-cron`.
- `google-sheets.service.js` — export des soumissions vers Google Sheets. **JWT RS256 signé à la main** (`https` + `crypto` natifs) : aucune dépendance `googleapis` requise.
- `social-media.service.js` — YouTube / Facebook / Instagram / TikTok, piloté par clés d'API en `.env`.

### Base de données

**SQLite** (`prisma/dev.db`), **10 migrations** appliquées de janvier à février 2026.

12 modèles Prisma : `Admin`, `Event`, `Testimonial`, `GalleryImage`, `SocialMediaPost`, `Settings`, `HeroSlide`, `Newsletter`, `Assembly`, `Ministry`, `Form`, `FormSubmission`.

Contenu local au 18/07/2026 :

| Table | Lignes | | Table | Lignes |
|-------|--------|-|-------|--------|
| hero_slides | 7 | | testimonials | 4 |
| ministries | 6 | | assemblies | 3 |
| gallery_images | 6 | | newsletter_subscribers | 1 |
| events | 5 | | admins | 1 |
| settings | 15 | | **social_media_posts** | **0** |
| | | | **forms / form_submissions** | **0** |

### Uploads

Multer, **limite 15 Mo**, traitement Sharp (génération WebP desktop + mobile pour le Hero).
Dossiers : `uploads/{hero,events,testimonials,gallery,ministries}`, servis en statique.

---

## 3. Frontend — `src/frontend`

### Site public

Page unique [`app/page.tsx`](../../src/frontend/app/page.tsx) composant 13 sections :
`HashScroll`, `Header`, `Hero`, `Vision`, `About`, `Values`, `Ministries`, `Events`, `Assemblies`, `Gallery`, `Testimonials`, `Newsletter`, `Footer`.

Page dynamique supplémentaire : `app/formulaires/[slug]/page.tsx`.

### Admin — 12 pages

`login` (`/admin`), `dashboard`, `events`, `hero`, `gallery`, `ministries`, `assemblies`, `testimonials`, `newsletter`, `social-media`, `settings`, `forms`.

Fonctionnalités : auth JWT via `localStorage`, upload avec aperçu, CRUD complet, suppression confirmée, statistiques.

### UI & divers

- ~60 composants Radix/shadcn dans `components/ui/`.
- Cartographie des assemblées via Leaflet / react-leaflet (`assembly-map.tsx`).
- Configuration API centralisée dans `lib/api.ts` (bascule dev/prod par `NEXT_PUBLIC_API_URL`).

### Internationalisation — infra prête, câblage à 4/13

Système maison : `contexts/LanguageContext.tsx` + `LanguageSelector.tsx` + `lib/translations/{fr,en,nl}.json`.

- ✅ **Les 3 fichiers sont parfaitement alignés** : 85 clés chacun, zéro écart de chemin.
- ✅ Les traductions couvrent **déjà** 12 sections : `nav`, `hero`, `vision`, `about`, `values`, `ministries`, `events`, `assemblies`, `gallery`, `testimonials`, `contact`, `footer`.
- ⚠️ **Seuls 4 fichiers appellent `useLanguage`** : `header`, `about`, `newsletter`, `LanguageSelector`.
- ⚠️ **9 composants restent en texte codé en dur** : `hero`, `vision`, `values`, `ministries`, `events`, `assemblies`, `gallery`, `testimonials`, `footer`.

> **À retenir** : le travail de *traduction* est fait. Il reste le *câblage* des composants. C'est nettement moins lourd que ne le laisse penser le taux de 30 %.

Cas particulier : la section `contact` est traduite en 3 langues (titre, sous-titre, téléphone, email, adresse, horaires, réseaux) mais **aucun composant `contact.tsx` n'existe** et rien ne la monte dans `page.tsx`.

---

## 4. Sécurité

- JWT avec expiration, mots de passe hachés bcrypt.
- Middleware `auth.middleware.js` protégeant les routes admin.
- Validation des uploads (type MIME, taille 15 Mo).
- CORS configuré ; secrets en `.env`, correctement ignoré par `.gitignore`.

---

## 5. Déploiement

`deploy.sh` à la racine : scp + rebuild + restart PM2, cibles `frontend` / `backend` / `all`.
Le `.env` du VPS n'est **jamais** écrasé par le déploiement.
Guides détaillés dans `deploiement/hostinger/` et `deploiement/local/`.

---

## 6. Démarrage rapide

```bash
# Backend  →  http://localhost:5000
cd src/backend && npm run dev

# Frontend →  http://localhost:3000
cd src/frontend && npm run dev

# Premier admin
./otherthings/scripts/create-admin.sh

# Admin : http://localhost:3000/admin
```

Scripts de seed et de maintenance : `otherthings/scripts/` (seed-all, seed-events, seed-hero, diagnostic, test-api…).

---

## 7. Stack technique

**Frontend** — Next.js 16.1 · React 19.2 · TypeScript · Tailwind CSS 4 · Radix UI · Lucide · Leaflet

**Backend** — Node.js · Express 4.21 · Prisma 6.2 · **SQLite** · JWT · Multer · Sharp · Nodemailer · node-cron · express-validator · axios

**APIs externes** (configurées mais non activées) — YouTube Data v3 · Facebook Graph · Instagram Graph · TikTok · Google Sheets v4

---

## 8. État par domaine

| Domaine | État |
|---------|------|
| Architecture monorepo | ✅ Solide et claire |
| Backend / API | ✅ Fonctionnel, 11 domaines métier |
| Base de données | ✅ Peuplée, migrations à jour |
| Site public | ✅ Opérationnel en production |
| Admin | ✅ Complet, 12 pages CRUD |
| Déploiement | ✅ Automatisé (VPS + PM2 + Nginx) |
| i18n | 🟡 Traductions complètes, **câblage 4/13 composants** |
| Formulaires | 🟡 Codé de bout en bout, **0 en base** |
| Réseaux sociaux | 🟡 Codé de bout en bout, **0 post synchronisé** |
| Section contact | 🟡 Traduite, **composant inexistant** |
| Historique Git | 🔴 Un seul commit (`bb918ed`) |
| Contrôle TypeScript | 🟡 `ignoreBuildErrors: true` |

---

## 9. Corrections apportées à la version de février 2026

L'ancienne synthèse affirmait plusieurs choses désormais fausses ou qui l'ont toujours été :

| Affirmation de février | Réalité vérifiée |
|------------------------|------------------|
| Base « PostgreSQL/MySQL » | **SQLite** (`prisma/dev.db`) — c'est ce qui tourne en production |
| 6 groupes de routes API | **11** |
| 7 pages admin | **12** |
| 3–4 pages admin listées comme fichiers créés | 12 pages existent |
| 6 modèles Prisma | **12** |
| « Intégration réseaux sociaux » cochée ✅ terminée | Codée mais **jamais activée** (0 post en base) |
| Aucune mention de : hero, newsletter, assemblées, ministères, formulaires | 5 domaines métier entiers absents du document |
| Aucune mention de Sharp, Nodemailer, node-cron, Leaflet, i18n | Tous présents dans le code |

---

## 10. Chantiers ouverts

Le détail, avec priorités et effort estimé, se trouve dans **[`ETAT-DES-LIEUX.md`](./ETAT-DES-LIEUX.md) § 6** et dans le plan d'action associé. En résumé :

1. Historique Git à reconstruire (traçabilité).
2. i18n : câbler les 9 composants restants.
3. Activer ou documenter les formulaires et les réseaux sociaux.
4. Accents manquants dans les métadonnées SEO (`layout.tsx`).
5. `next.config.mjs` : `remotePatterns` non aligné sur `api.cmcibelgique.org`.
6. Réactiver le contrôle TypeScript au build.
7. Lockfiles mixtes npm/pnpm à trancher.
8. Sauvegarde de `dev.db` (seul état persistant).

---

**Le projet est fonctionnel et déployé en production.** Les chantiers restants relèvent de la finition et de l'hygiène projet, pas de la construction.
