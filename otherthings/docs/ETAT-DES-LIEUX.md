# État des lieux — CMCI Belgique Website

> Analyse réalisée le **8 juillet 2026** sur la branche `main` (copie de travail propre).
> Ce document décrit l'état **réel du code** tel qu'il est dans le dépôt, indépendamment des anciens fichiers de statut (`MODIFICATIONS-ACTUELLES.md`, `STATUS-FINAL-EVENTS.md`, etc.) qui datent de février 2026.

---

## 1. Vue d'ensemble

Site web de la **Communauté Missionnaire Chrétienne Internationale (CMCI) Belgique** : site public + interface d'administration + API REST.

Architecture **monorepo** organisée en deux applications dans `src/` :

| Bloc | Techno | Rôle |
|------|--------|------|
| `src/frontend` | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Radix UI | Site public + panneau admin |
| `src/backend`  | Express 4, Prisma 6, SQLite, JWT, Multer, Sharp, Nodemailer | API REST, uploads, emails, cron |

- **Domaines de production** : `https://www.cmcibelgique.org` (front) et `https://api.cmcibelgique.org` (API).
- **Hébergement** : VPS `185.97.146.100`, géré via **PM2** + **Nginx** (reverse proxy, SSL). Front en port `3001`, back en port `5001` sur le VPS.

---

## 2. État Git

- Branche courante : `main`, synchronisée avec `origin/main`, **copie de travail propre**.
- ⚠️ **Un seul commit dans tout l'historique** : `bb918ed "latest"` (04/04/2026). Il n'y a **aucun historique de versions** — impossible de suivre l'évolution ou de revenir en arrière proprement. C'est le point de fragilité principal côté organisation.

---

## 3. Backend (`src/backend`)

### Structure
- **`server.js`** : point d'entrée Express, monte 11 groupes de routes + `/api/health`, sert `/uploads` en statique, initialise les cron jobs newsletter.
- **11 modules de routes** : `auth`, `events`, `hero`, `testimonials`, `gallery`, `social-media`, `settings`, `newsletter`, `assemblies`, `ministries`, `forms`.
- **4 services** : `email.service.js`, `google-sheets.service.js`, `newsletter-cron.service.js`, `social-media.service.js`.
- **Middleware** : `auth.middleware.js` (JWT).
- **Utils** : `image-processor.js` (Sharp), `migrate-hero-images.js`.

### Base de données
- **SQLite** (`prisma/dev.db`, ~139 Ko), 10 migrations appliquées (jan → fév 2026).
- Modèles Prisma : `Admin`, `Event`, `Testimonial`, `GalleryImage`, `SocialMediaPost`, `Settings`, `HeroSlide`, `Newsletter`, `Assembly`, `Ministry`, `Form`, `FormSubmission`.

### Contenu actuel en base (local)
| Table | Lignes |
|-------|--------|
| admins | 1 |
| events | 5 |
| testimonials | 4 |
| gallery_images | 6 |
| settings | 15 |
| hero_slides | 7 |
| assemblies | 3 |
| ministries | 6 |
| newsletter_subscribers | 1 |
| social_media_posts | **0** |
| forms | **0** |
| form_submissions | **0** |

> Le système de **formulaires** (schéma + routes + service Google Sheets + page admin `forms`) et le système **réseaux sociaux** sont codés mais **pas encore utilisés/alimentés** en base.

### Fonctionnalités backend
- Authentification JWT + bcrypt, routes admin protégées par middleware.
- Upload d'images via Multer (**limite 15 Mo**), traitement Sharp (génération WebP desktop/mobile pour le Hero).
- Newsletter : abonnement, cron d'envoi (`node-cron`), emails via Nodemailer (Gmail ou SMTP).
- Intégration Google Sheets pour les soumissions de formulaires.
- Services réseaux sociaux (YouTube/Facebook/Instagram/TikTok) avec workflow de validation.

---

## 4. Frontend (`src/frontend`)

### Pages
- **Site public** : page unique `app/page.tsx` composée de sections (Header, Hero, Vision, About, Values, Ministries, Events, Assemblies, Gallery, Testimonials, Newsletter, Footer).
- **Page formulaires dynamiques** : `app/formulaires/[slug]/page.tsx`.
- **Admin** (12 pages sous `app/admin/`) : `dashboard`, `events`, `hero`, `gallery`, `ministries`, `assemblies`, `testimonials`, `newsletter`, `social-media`, `settings`, `forms`, + login.

### UI
- ~60 composants Radix/shadcn dans `components/ui/`.
- Cartographie des assemblées via **Leaflet / react-leaflet** (`assembly-map.tsx`).
- Configuration API centralisée dans `lib/api.ts` (bascule dev/prod via `NEXT_PUBLIC_API_URL`).

### Internationalisation (i18n) — **partielle**
- Système maison : `contexts/LanguageContext.tsx` + `LanguageSelector.tsx` + traductions `fr/en/nl.json` (382 clés chacune, parfaitement alignées).
- ⚠️ **Seuls 4 éléments consomment réellement les traductions** : `header`, `about`, `newsletter`, `LanguageSelector`.
- **Composants NON traduits** (encore en dur) : `hero`, `vision`, `values`, `ministries`, `events`, `assemblies`, `gallery`, `testimonials`, `footer`.
- C'est le principal chantier fonctionnel inachevé du front.

---

## 5. Configuration & déploiement

- **Env front** : `.env.local` → `http://localhost:5000` ; `.env.production` → `https://api.cmcibelgique.org`.
- **Env back** : `.env` complet (DB, JWT, ports, clés réseaux sociaux, config email Gmail/SMTP, URLs, newsletter). Correctement ignoré par `.gitignore`.
- **Déploiement** : `deploy.sh` (scp + rebuild + restart PM2 sur le VPS), avec cibles `frontend` / `backend` / `all`. Le `.env` du VPS n'est jamais écrasé.
- Documentation de déploiement dans `deploiement/hostinger/` et `deploiement/local/`.
- Scripts de seed/maintenance nombreux dans `otherthings/scripts/`.

---

## 6. Points d'attention / dette technique

1. **Historique Git inexistant** (1 seul commit « latest ») — à corriger en priorité pour la traçabilité.
2. **i18n incomplète** : 9 composants publics restent non traduits alors que l'infra multilingue existe.
3. **Build TypeScript avec erreurs ignorées** : `next.config.mjs` a `typescript.ignoreBuildErrors: true` — des erreurs de typage peuvent passer inaperçues.
4. **`next.config.mjs` — images** : `remotePatterns` n'autorise que `localhost:5000`. En prod les images passent parce que `images.unoptimized: true`, mais la config n'est pas alignée avec le domaine `api.cmcibelgique.org`.
5. **Métadonnées SEO sans accents** dans `layout.tsx` (« Communaute », « Chretienne », « devoues »…) — à corriger pour la présentation.
6. **Lockfiles mixtes** : présence simultanée de `package-lock.json` (npm) et d'un `pnpm-lock.yaml` quasi vide (92 octets). Choisir un seul gestionnaire.
7. **Fonctionnalités codées mais inactives** : formulaires (0 en base) et réseaux sociaux (0 post) — à finaliser/activer ou documenter comme « à venir ».
8. **Base SQLite** : le README mentionne PostgreSQL/MySQL, mais le projet tourne réellement sur **SQLite**. Convient à ce volume, mais à garder en tête pour la sauvegarde (le fichier `dev.db` est le seul état).
9. **Nombreux fichiers de doc datés** (fév. 2026) à la racine, partiellement redondants et désormais obsolètes par rapport au code.

---

## 7. Synthèse

| Domaine | État |
|---------|------|
| Architecture générale | ✅ Solide, claire (monorepo front/back) |
| Backend / API | ✅ Fonctionnel, riche (11 domaines métier) |
| Base de données | ✅ Peuplée, migrations à jour (SQLite) |
| Site public | ✅ Opérationnel |
| Admin | ✅ Complet (12 pages CRUD) |
| Déploiement | ✅ Automatisé (VPS + PM2 + Nginx) |
| i18n | 🟡 Infra prête, **traduction ~30 % des composants** |
| Formulaires / Réseaux sociaux | 🟡 Codés, **non activés** |
| Historique Git | 🔴 Quasi inexistant |
| Qualité build (TS) | 🟡 Erreurs de type ignorées |

**Conclusion** : le projet est **fonctionnel et déployé en production**. Les chantiers ouverts sont surtout de la finition (i18n à terminer, SEO/accents, formulaires & réseaux sociaux à activer) et de l'hygiène projet (historique Git, lockfile unique, réactivation du contrôle TypeScript).
