# 🚀 Sendbox - Plateforme de Covalissage Sécurisée

**Sendbox** connecte voyageurs et expéditeurs pour un transport de colis international sécurisé, traçable et assuré.

## 📊 Statut du Projet

- **Version** : 0.1.0 (MVP Opérationnel ✅)
- **Corridor** : France ↔ Bénin
- **Stack** : Next.js 16 + Supabase + Stripe Connect
- **Statut** : MVP Fonctionnel - Tests 21/21 ✅
- **Date** : 19 Décembre 2024

## 🏗️ Architecture

```
📁 sendbox-project/
├── 📁 app/          # Frontend Next.js + API Routes
├── 📁 supabase/     # Backend Supabase (SQL, functions)
├── 📁 docs/         # Documentation technique complète
├── 📁 components/   # Composants React réutilisables
├── 📁 lib/          # Utilitaires et clients (Supabase, validations)
├── 📁 types/        # Types TypeScript globaux
└── 📁 scripts/      # Scripts d'automatisation
```

## 🚀 Quick Start (5 minutes)

### Prérequis

- Node.js 20+
- npm 10+
- Compte Supabase (gratuit)

### Installation

```bash
# 1. Cloner le projet
git clone <url>
cd sendbox

# 2. Installer dépendances
npm install

# 3. Configurer variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# 4. Démarrer en dev
npm run dev
# Ouvrir http://localhost:3000
```

## 📚 Documentation

- [Guide de Démarrage](docs/SETUP.md) - Premiers pas (30 min)
- [Guide de Test MVP](docs/MVP_TESTING_GUIDE.md) - Tests manuels complets ⭐
- [Résultats Tests Endpoints](docs/ENDPOINTS_TEST_RESULTS.md) - Rapport 21/21 ✅
- [Architecture](docs/README.md) - Documentation technique complète
- [Fonctions RPC](docs/RPC_FUNCTIONS.md) - Documentation des fonctions RPC Supabase
- [Tests E2E](docs/TESTING.md) - Guide des tests End-to-End
- [ADR](docs/ADR/) - Décisions architecturales

## 🛠️ Stack Technique

### Frontend

- Next.js 14 (App Router, Server Components)
- TypeScript (mode strict)
- Tailwind CSS + Shadcn/ui
- React Hook Form + Zod

### Backend

- Supabase (PostgreSQL + Auth + Storage + Realtime)
- Stripe Connect (paiements sécurisés)
- Resend (emails transactionnels)

### DevOps

- Vercel (hosting frontend)
- Supabase Cloud (backend)
- GitHub Actions (CI/CD)

## 🗂️ Scripts Disponibles

```bash
# Développement
npm run dev          # Démarre le serveur dev (localhost:3000)
npm run build        # Build production
npm run start        # Démarre le serveur production

# Qualité de code
npm run lint         # Linter ESLint
npm run format       # Formatter Prettier
npm run format:check # Vérifier formatage sans modifier

# Tests
node_modules/.bin/tsx scripts/test-all-endpoints.ts  # Teste tous les endpoints (21/21 ✅)
npm run test:e2e     # Tests E2E avec Playwright
npm run test:e2e:ui  # Tests E2E en mode UI interactif
npm run test:e2e:headed # Tests E2E avec navigateur visible

# Stripe
npm run stripe:listen  # Configure webhook Stripe (auto-update .env.local)
npm run stripe:test    # Teste les événements Stripe
npm run stripe:check   # Analyse les workflows Stripe

# Supabase
npm run db:start     # Démarre Supabase local (Docker)
supabase db push --linked  # Applique migrations en production
npx tsx scripts/test-rpc-simple.ts  # Teste les fonctions RPC
```

## 📦 Supabase Setup

### Développement Local

```bash
# Installer Supabase CLI
npm install -g supabase

# Démarrer Supabase localement (nécessite Docker)
supabase start

# Appliquer le schéma initial
supabase db push

# Accéder à Supabase Studio
# http://localhost:54323
```

### Production

```bash
# Lier projet local avec Supabase Cloud
supabase link --project-ref tpvjycjlzxlbrtbvyfsx

# Appliquer migrations en production
supabase db push --linked
```

## 🎯 État du MVP

### ✅ Fonctionnalités Opérationnelles

- ✅ **Authentification complète** : Inscription, connexion, vérification email
- ✅ **KYC** : Upload documents, validation, approbation
- ✅ **Annonces** : Création multi-step, recherche, autocomplete villes
- ✅ **Réservations** : Création avec photos, acceptation/refus
- ✅ **Paiement Stripe Connect** : Payment Intent, webhooks, commission
- ✅ **Messagerie temps réel** : Conversations, notifications
- ✅ **Traçabilité QR** : Scan dépôt/livraison, géolocalisation
- ✅ **Système de notation** : Notes mutuelles, moyenne profil
- ✅ **Génération PDF** : Contrats de transport
- ✅ **Sécurité** : RLS, validation Zod, rate limiting, CSP

### ⚠️ En Développement

- ⚠️ **Emails transactionnels** : Configuration Resend
- ⚠️ **Tests E2E Playwright** : Suite complète à finaliser
- ⚠️ **Dashboard Admin** : Fonctionnalités avancées
- ⚠️ **Déploiement Production** : Configuration Vercel + CI/CD

### 📊 Tests Automatiques

**21/21 tests réussis** ✅ (voir [docs/ENDPOINTS_TEST_RESULTS.md](docs/ENDPOINTS_TEST_RESULTS.md))

```bash
# Exécuter les tests
node_modules/.bin/tsx scripts/test-all-endpoints.ts
```

### 🚀 Quick Start MVP

1. Cloner le projet et installer les dépendances
2. Appliquer les migrations Supabase (027, 028)
3. Configurer `.env.local` (voir `.env.example`)
4. Lancer `npm run dev`
5. Accéder à http://localhost:3000

**Compte de test** : amieladjovi@yahoo.fr / Amieldylan2025@

Voir [docs/MVP_TESTING_GUIDE.md](docs/MVP_TESTING_GUIDE.md) pour les tests complets.

## 🤝 Contribution

Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines de contribution.

## 📄 Licence

Propriétaire - © 2024 Sendbox

## 🔗 Liens Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Stripe Connect](https://stripe.com/docs/connect)
- [Shadcn/ui](https://ui.shadcn.com)

## 💬 Support

- Email : support@sendbox.io
- Discord : (à venir)
- GitHub Issues : (actif)

---

**Built with ❤️ using Next.js, Supabase & Stripe**
