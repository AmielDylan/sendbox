# 🚀 Sendbox - Plateforme de Covalissage Sécurisée

**Sendbox** connecte voyageurs et expéditeurs pour un transport de colis international sécurisé, traçable et assuré.

## 📊 Statut du Projet

- **Version** : 0.1.0 (MVP en développement)
- **Corridor** : France ↔ Bénin
- **Stack** : Next.js 14 + Supabase + Stripe Connect
- **Statut** : Sprint 1/10 (Fondations) ✅

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
npm run test:e2e     # Tests E2E avec Playwright
npm run test:e2e:ui  # Tests E2E en mode UI interactif
npm run test:e2e:headed # Tests E2E avec navigateur visible

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

## 🎯 Roadmap MVP (10 Sprints)

- [x] Sprint 1 : Fondations (Next.js + Supabase + Design System)
- [ ] Sprint 2 : Authentification + KYC
- [ ] Sprint 3 : Module Annonces
- [ ] Sprint 4 : Module Réservations + Paiement
- [ ] Sprint 5 : Messagerie + Notifications
- [ ] Sprint 6 : Traçabilité QR + PDF
- [ ] Sprint 7 : Ratings + Admin
- [ ] Sprint 8 : Dashboard Admin Complet
- [ ] Sprint 9 : Tests + Sécurité
- [ ] Sprint 10 : Déploiement Production

**Durée estimée** : 10 semaines (290 heures)

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
