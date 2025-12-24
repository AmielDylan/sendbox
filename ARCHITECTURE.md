# 🏗️ Architecture Améliorée - Sendbox

## 📋 Problèmes identifiés dans la structure actuelle

### ❌ Points à améliorer
1. **`lib/actions/`** : 18 fichiers d'actions mélangés sans regroupement logique
2. **`lib/utils/`** : Tous les utilitaires au même niveau
3. **`scripts/`** : Mix de scripts de test, migrations et utilitaires
4. **`types/`** : Pas d'organisation par domaine métier
5. **Manque de documentation** : README absents après nettoyage

---

## ✅ Nouvelle Structure Proposée

```
sendbox/
├── 📱 app/                          # Next.js App Router (INCHANGÉ - Bon)
│   ├── (auth)/                      # Routes authentification
│   ├── (dashboard)/                 # Routes dashboard utilisateur
│   ├── (public)/                    # Routes publiques
│   ├── admin/                       # Routes admin
│   └── api/                         # API routes
│
├── 🧩 components/                   # Composants React (AMÉLIORÉ)
│   ├── features/                    # Composants métier par domaine
│   │   ├── announcements/           # Annonces
│   │   ├── bookings/                # Réservations
│   │   ├── kyc/                     # Vérification identité
│   │   ├── messages/                # Messagerie
│   │   ├── notifications/           # Notifications
│   │   ├── payments/                # Paiements
│   │   └── ratings/                 # Notations
│   ├── layouts/                     # Layouts réutilisables
│   ├── shared/                      # ⭐ NOUVEAU: Composants partagés
│   │   ├── forms/                   # Formulaires génériques
│   │   ├── data-display/            # Affichage de données
│   │   └── navigation/              # Navigation
│   └── ui/                          # Composants UI de base (shadcn)
│
├── 📚 lib/                          # Logique métier (RESTRUCTURÉ)
│   ├── core/                        # ⭐ NOUVEAU: Cœur applicatif
│   │   ├── announcements/           # Domaine: Annonces
│   │   │   ├── actions.ts           # Server actions
│   │   │   ├── queries.ts           # Requêtes DB
│   │   │   ├── validations.ts       # Schemas Zod
│   │   │   └── utils.ts             # Utilitaires spécifiques
│   │   ├── auth/                    # Domaine: Authentification
│   │   ├── bookings/                # Domaine: Réservations
│   │   ├── kyc/                     # Domaine: KYC
│   │   ├── messages/                # Domaine: Messages
│   │   ├── notifications/           # Domaine: Notifications
│   │   ├── payments/                # Domaine: Paiements
│   │   ├── profile/                 # Domaine: Profil
│   │   └── ratings/                 # Domaine: Notations
│   │
│   ├── shared/                      # ⭐ NOUVEAU: Code partagé
│   │   ├── config/                  # Configuration
│   │   │   ├── features.ts          # Feature flags
│   │   │   ├── constants.ts         # Constantes
│   │   │   └── env.ts               # Variables environnement
│   │   ├── db/                      # Base de données
│   │   │   ├── client.ts            # Client Supabase
│   │   │   └── server.ts            # Server Supabase
│   │   ├── security/                # Sécurité
│   │   │   ├── rate-limit.ts
│   │   │   ├── upload-validation.ts
│   │   │   └── xss-protection.ts
│   │   ├── services/                # Services externes
│   │   │   ├── email/               # Service email
│   │   │   ├── stripe/              # Service Stripe
│   │   │   └── pdf/                 # Génération PDF
│   │   └── utils/                   # Utilitaires génériques
│   │       ├── dates.ts             # Manipulation dates
│   │       ├── files.ts             # Gestion fichiers
│   │       ├── formatters.ts        # Formatage
│   │       └── validators.ts        # Validations génériques
│   │
│   └── types/                       # ⭐ RÉORGANISÉ: Types par domaine
│       ├── database.types.ts        # Types Supabase générés
│       ├── announcements.ts         # Types annonces
│       ├── auth.ts                  # Types auth
│       ├── bookings.ts              # Types réservations
│       ├── shared.ts                # Types partagés
│       └── index.ts                 # Exports centralisés
│
├── 🪝 hooks/                        # Custom React Hooks (INCHANGÉ - Bon)
│
├── 🎨 public/                       # Assets statiques (INCHANGÉ)
│
├── 🗄️ supabase/                     # Configuration Supabase (INCHANGÉ - Bon)
│   ├── migrations/                  # Migrations SQL
│   └── functions/                   # Edge functions
│
├── 🧪 tests/                        # ⭐ NOUVEAU: Tests centralisés
│   ├── e2e/                         # Tests end-to-end (Playwright)
│   │   ├── announcements/
│   │   ├── auth/
│   │   ├── bookings/
│   │   └── helpers/
│   ├── integration/                 # Tests d'intégration
│   └── unit/                        # Tests unitaires
│
└── 🔧 scripts/                      # ⭐ RÉORGANISÉ: Scripts utilitaires
    ├── dev/                         # Scripts de développement
    │   ├── check-schema.ts
    │   └── test-*.ts
    ├── db/                          # Scripts base de données
    │   ├── apply-migration-*.sh
    │   └── generate-types.sh
    └── setup/                       # Scripts de configuration
        └── stripe-webhook-setup.ts
```

---

## 🎯 Avantages de la nouvelle structure

### 1. **Organisation par domaine métier** (Domain-Driven Design)
- Chaque domaine (`announcements`, `bookings`, etc.) regroupe :
  - Actions serveur
  - Requêtes DB
  - Validations
  - Utilitaires spécifiques
  - Types

### 2. **Séparation core/shared**
- **`lib/core/`** : Logique métier spécifique
- **`lib/shared/`** : Code réutilisable entre domaines

### 3. **Scripts mieux organisés**
- **`scripts/dev/`** : Développement
- **`scripts/db/`** : Base de données  
- **`scripts/setup/`** : Configuration

### 4. **Tests centralisés**
- Un seul dossier `tests/` au lieu de `e2e/` à la racine

### 5. **Types par domaine**
- Facilite la maintenance et la recherche

---

## 📦 Exemple de structure d'un domaine

```typescript
lib/core/bookings/
├── actions.ts              # Server actions (createBooking, updateBooking...)
├── queries.ts              # Requêtes DB (getBookings, getBookingById...)
├── validations.ts          # Schemas Zod (bookingSchema, updateBookingSchema...)
├── utils.ts                # Fonctions utilitaires (calculatePrice, formatStatus...)
└── types.ts                # Types spécifiques (BookingWithDetails, BookingFilters...)
```

---

## 🚀 Plan de migration

### Phase 1 : Préparation (FAIT)
- [x] Créer ce document d'architecture
- [ ] Créer les nouveaux dossiers

### Phase 2 : Migration progressive
- [ ] Migrer `lib/actions/` → `lib/core/{domain}/actions.ts`
- [ ] Migrer `lib/utils/` → `lib/shared/utils/` ou `lib/core/{domain}/utils.ts`
- [ ] Migrer `types/` → `lib/types/{domain}.ts`
- [ ] Déplacer `e2e/` → `tests/e2e/`
- [ ] Réorganiser `scripts/`

### Phase 3 : Mise à jour des imports
- [ ] Mettre à jour tous les imports
- [ ] Vérifier le build
- [ ] Vérifier les tests

### Phase 4 : Documentation
- [ ] Créer README.md racine
- [ ] Créer README.md par domaine
- [ ] Documenter les conventions

---

## 📝 Conventions de nommage

### Fichiers
- **Actions** : `actions.ts` (server actions)
- **Requêtes** : `queries.ts` (requêtes DB)
- **Validations** : `validations.ts` (schemas Zod)
- **Types** : `types.ts` ou `{domain}.ts`
- **Utils** : `utils.ts` ou fonction spécifique (ex: `calculations.ts`)

### Dossiers
- **kebab-case** : `user-profile/`, `booking-requests/`
- **Domaines au pluriel** : `announcements/`, `bookings/`
- **Services au singulier** : `email/`, `stripe/`

---

## 🎨 Principes de design

1. **Colocation** : Grouper ce qui change ensemble
2. **Isolation** : Minimiser les dépendances entre domaines
3. **Clarté** : Structure évidente pour nouveaux développeurs
4. **Scalabilité** : Facilite l'ajout de nouvelles features
5. **Maintenance** : Code facile à retrouver et modifier

---

**Date de création** : 2025-12-24  
**Statut** : 📝 Proposition (En attente de validation)

