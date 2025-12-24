# 📦 Sendbox - Plateforme de Covoiturage de Colis

> Connectez voyageurs et expéditeurs entre la France et le Bénin

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.0-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

---

## 🚀 Démarrage Rapide

```bash
# Installation des dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📚 Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Structure du projet et conventions
- **[Supabase Docs](./supabase/)** - Configuration base de données
- **[Tests](./tests/)** - Documentation des tests

---

## 🏗️ Architecture

Le projet suit une architecture **Domain-Driven Design** pour une meilleure organisation :

```
sendbox/
├── app/                    # Next.js App Router (pages et API)
├── components/             # Composants React
│   ├── features/          # Composants métier par domaine
│   ├── shared/            # Composants réutilisables
│   └── ui/                # Composants UI de base (shadcn)
├── lib/                   # Logique métier
│   ├── core/             # Domaines métier
│   │   ├── announcements/
│   │   ├── bookings/
│   │   ├── auth/
│   │   └── ...
│   └── shared/           # Code partagé
│       ├── config/
│       ├── db/
│       ├── services/
│       └── utils/
├── hooks/                # Custom React Hooks
├── tests/                # Tests (e2e, integration, unit)
└── supabase/            # Configuration Supabase
```

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour plus de détails.

---

## ✨ Fonctionnalités

### 🎯 MVP Actuel

- ✅ Authentification (email/password)
- ✅ Annonces de trajet (création, édition, recherche)
- ✅ Réservations de colis (workflow complet)
- ✅ Paiements Stripe
- ✅ QR Codes (dépôt/livraison)
- ✅ Notations et avis
- ✅ Messagerie temps réel
- ✅ Dashboard admin
- ✅ KYC (vérification identité) - Feature flag

### 🚧 En cours

- [ ] Notifications push
- [ ] Export PDF des contrats
- [ ] Application mobile (React Native)

---

## 🛠️ Stack Technique

### Frontend
- **Next.js 16** - App Router, Server Actions, Middleware
- **React 19** - Composants serveur et client
- **TypeScript 5** - Typage fort
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Composants UI (Nova theme)
- **Tabler Icons** - Icônes
- **Figtree** - Font

### Backend
- **Supabase** - Base de données PostgreSQL
- **Supabase Auth** - Authentification
- **Supabase Storage** - Fichiers (photos, documents KYC)
- **Supabase Realtime** - Messagerie temps réel
- **Stripe** - Paiements sécurisés

### DevOps
- **Playwright** - Tests end-to-end
- **ESLint** - Linting
- **Prettier** - Formatage
- **Git** - Contrôle de version

---

## 📜 Scripts Disponibles

### Développement
```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build de production
npm run start        # Démarrer le serveur de production
npm run lint         # Linter le code
npm run format       # Formater le code
```

### Tests
```bash
npm run test:e2e            # Tests end-to-end
npm run test:e2e:ui         # Tests avec interface UI
npm run test:e2e:debug      # Tests en mode debug
```

### Stripe
```bash
npm run stripe:listen       # Écouter les webhooks Stripe
npm run stripe:test         # Tester les événements Stripe
npm run stripe:check        # Vérifier les workflows
```

### Base de données
```bash
bash scripts/db/generate-types.sh   # Générer les types TypeScript
bash scripts/db/apply-migration-*.sh # Appliquer une migration
```

---

## 🔐 Variables d'Environnement

Créer un fichier `.env.local` avec :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Resend (Email)
RESEND_API_KEY=re_xxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🧪 Tests

```bash
# Tests end-to-end avec Playwright
npm run test:e2e

# Tests avec interface UI
npm run test:e2e:ui

# Tests en mode headed (voir le navigateur)
npm run test:e2e:headed
```

Les tests sont organisés par domaine dans `tests/e2e/`.

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est sous licence MIT.

---

## 👥 Équipe

Développé avec ❤️ par l'équipe Sendbox

---

## 🔗 Liens Utiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
