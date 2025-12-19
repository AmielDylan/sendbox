# Scripts Sendbox

Scripts d'automatisation et de test pour le projet Sendbox.

## 🧪 Scripts Stripe

### `stripe-webhook-setup.ts`

Configure automatiquement le webhook Stripe pour le développement local.

**Usage** :
```bash
npm run stripe:listen
```

**Fonctionnalités** :
- Lance `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Détecte automatiquement le secret webhook (`whsec_...`)
- Met à jour `STRIPE_WEBHOOK_SECRET` dans `.env.local`
- Affiche les événements en temps réel

**Prérequis** :
- Stripe CLI installé (`brew install stripe/stripe-cli/stripe`)
- Serveur Next.js démarré sur `localhost:3000`

---

### `stripe-test-events.ts`

Déclenche des événements Stripe de test pour valider les webhooks.

**Usage** :
```bash
# Simuler un paiement réussi
npm run stripe:test payment_succeeded

# Simuler un paiement échoué
npm run stripe:test payment_failed

# Simuler un remboursement
npm run stripe:test refund

# Déclencher tous les événements
npm run stripe:test all
```

**Événements disponibles** :
- `payment_succeeded` → `payment_intent.succeeded`
- `payment_failed` → `payment_intent.payment_failed`
- `refund` → `charge.refunded`

---

### `check-stripe-workflows.ts`

Analyse le code pour identifier tous les workflows Stripe.

**Usage** :
```bash
npm run stripe:check
```

**Rapport généré** :
- ✅ Événements webhook gérés
- 📡 Appels API Stripe
- 👤 Fonctions admin utilisant Stripe
- 📝 TODOs liés à Stripe

---

## 🗄️ Scripts Base de Données

### `test-rpc-simple.ts`

Teste toutes les fonctions RPC Supabase.

**Usage** :
```bash
npx tsx scripts/test-rpc-simple.ts
```

---

### `check-schema.ts`

Vérifie l'existence des tables et colonnes dans la base de données.

**Usage** :
```bash
npx tsx scripts/check-schema.ts
```

---

### `check-enum-values.ts`

Vérifie les valeurs des enums dans la base de données.

**Usage** :
```bash
npx tsx scripts/check-enum-values.ts
```

---

## 📋 Workflow de Développement

### 1. Démarrer le développement

```bash
# Terminal 1: Démarrer Next.js
npm run dev

# Terminal 2: Configurer webhook Stripe
npm run stripe:listen
```

### 2. Tester les webhooks

```bash
# Dans un troisième terminal
npm run stripe:test payment_succeeded
```

### 3. Vérifier les workflows

```bash
npm run stripe:check
```

---

## 🔧 Prérequis

- Node.js 20+
- Stripe CLI (`brew install stripe/stripe-cli/stripe`)
- Variables d'environnement configurées dans `.env.local`

---

## 📚 Documentation

- [Documentation Stripe](../docs/STRIPE.md)
- [Documentation RPC](../docs/RPC_FUNCTIONS.md)
- [Guide de Test](../docs/TESTING.md)


