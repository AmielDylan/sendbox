# 📦 Sendbox

Plateforme de covoiturage de colis entre la France et le Bénin.

## 🚀 Stack Technique

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI**: Shadcn UI (Nova theme) + Tailwind CSS v4
- **Base de données**: Supabase (PostgreSQL + RLS)
- **Authentification**: Supabase Auth
- **Paiements**: Stripe
- **PDF**: React-PDF
- **Validation**: Zod + React Hook Form
- **Icons**: Tabler Icons
- **Font**: Figtree

## 📁 Architecture

```
sendbox/
├── app/                    # Routes Next.js
│   ├── (auth)/            # Pages d'authentification
│   ├── (dashboard)/       # Dashboard utilisateur
│   ├── (public)/          # Pages publiques
│   ├── admin/             # Dashboard admin
│   └── api/               # API routes (webhooks, paiements)
│
├── components/
│   ├── ui/                # Composants Shadcn UI
│   ├── features/          # Composants métier
│   │   ├── announcements/
│   │   ├── bookings/
│   │   ├── kyc/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── payments/
│   │   └── ratings/
│   └── layouts/           # Layouts réutilisables
│
├── lib/
│   ├── core/              # Logique métier par domaine
│   │   ├── admin/
│   │   ├── announcements/
│   │   ├── auth/
│   │   ├── bookings/
│   │   ├── kyc/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── payments/
│   │   ├── profile/
│   │   └── ratings/
│   │
│   ├── shared/            # Code partagé
│   │   ├── config/        # Configuration (features, proxy)
│   │   ├── db/            # Clients Supabase + queries
│   │   ├── security/      # Rate limiting, validation uploads
│   │   ├── services/      # Email, PDF, Stripe
│   │   └── utils/         # Utilitaires (cities, files)
│   │
│   └── utils.ts           # Utilitaire cn() pour Tailwind
│
├── hooks/                 # React hooks personnalisés
├── types/                 # Types TypeScript
├── supabase/              # Migrations + seed
└── tests/                 # Tests unitaires et intégration
```

## 🎨 Design System

- **Style**: Nova (compact layout)
- **Base Color**: Zinc
- **Theme**: Green
- **Radius**: Small (0.375rem)
- **Menu Accent**: Subtle

## 🔐 Feature Flags

Le projet utilise un système de feature flags (`lib/shared/config/features.ts`) :

- `KYC_ENABLED`: Vérification d'identité (actuellement désactivé)
- `REALTIME_MESSAGING`: Messagerie temps réel
- `STRIPE_PAYMENTS`: Paiements Stripe
- `ADMIN_DASHBOARD`: Dashboard administrateur

## 🛠️ Installation

```bash
# Cloner le projet
git clone https://github.com/AmielDylan/sendbox.git
cd sendbox

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Lancer le serveur de développement
npm run dev
```

## 📝 Variables d'environnement

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗄️ Base de données

```bash
# Lancer les migrations
npx supabase db push

# Réinitialiser la base
npx supabase db reset

# Générer les types TypeScript
npm run generate:types
```

## 🧪 Tests

```bash
# Tests unitaires
npm run test:unit

# Tests d'intégration
npm run test:integration

# Tests RLS
npm run test:rls

# Tout exécuter
npm run test:all
```

## 📦 Build

```bash
# Build de production
npm run build

# Lancer en production
npm start
```

## 🚢 Déploiement

Le projet est configuré pour être déployé sur Vercel :

```bash
# Déployer sur Vercel
vercel --prod
```

## 📄 Licence

MIT

## 👥 Auteur

Amiel Dylan - [@AmielDylan](https://github.com/AmielDylan)
