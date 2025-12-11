# Documentation Stripe - Sendbox

Intégration Stripe Connect en mode escrow pour les paiements sécurisés.

## 📋 Vue d'ensemble

Les fonds sont bloqués sur le compte Sendbox jusqu'à confirmation de livraison, garantissant la sécurité des transactions.

## 🔐 Configuration

### Variables d'environnement requises

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Setup Stripe Connect

1. Créer un compte Stripe Connect : https://stripe.com/docs/connect
2. Activer le mode test
3. Configurer les webhooks dans le Dashboard Stripe :
   - URL : `https://votre-domaine.com/api/webhooks/stripe`
   - Événements : `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

## 🔄 Flow de Paiement

### 1. Création de réservation

L'expéditeur crée une réservation avec :
- Poids, description, valeur déclarée
- Photos optionnelles
- Option assurance

### 2. Page de paiement

**Route** : `/dashboard/colis/[id]/paiement`

- Affichage récapitulatif
- Stripe Elements pour carte bancaire
- Calcul tarifaire en temps réel
- Mentions légales (CGV, assurance)

### 3. Création Payment Intent

**API Route** : `/api/payments/create-intent`

- Récupère le booking
- Calcule les montants (transport + commission + assurance)
- Crée un Payment Intent Stripe avec metadata
- Application fee (commission Sendbox)
- Sauvegarde `payment_intent_id` dans le booking

### 4. Confirmation paiement

**Webhook** : `/api/webhooks/stripe`

- Événement `payment_intent.succeeded` :
  - Met à jour booking (`status: 'confirmed'`, `paid_at`)
  - Crée transaction
  - Notification voyageur (TODO)
  - Email confirmation (TODO)

- Événement `payment_intent.payment_failed` :
  - Crée transaction avec status 'failed'
  - Log erreur

- Événement `charge.refunded` :
  - Crée transaction de refund
  - Met à jour booking (`status: 'cancelled'`)

## 💰 Calculs Tarifaires

### Montants

- **Prix transport** : `weight_kg × price_per_kg`
- **Commission Sendbox** : `transport_price × 12%`
- **Assurance** (optionnel) : `package_value × 1.5% + 2 €`
- **Total** : `transport + commission + assurance`

### Application Fee

La commission Sendbox est prélevée via `application_fee_amount` dans le Payment Intent.

## 🔒 Sécurité

### Vérifications

- Authentification requise
- KYC approuvé pour créer réservation
- Booking appartient à l'utilisateur
- Booking non déjà payé (idempotency)
- Signature webhook vérifiée

### Idempotency

- Vérification `paid_at` avant traitement webhook
- Évite les doubles paiements
- Logs pour audit

## 📊 Base de Données

### Colonnes ajoutées à `bookings`

- `payment_intent_id` : ID du Payment Intent Stripe
- `paid_at` : Date de paiement confirmé
- `total_price` : Prix transport (sans commission)
- `commission_amount` : Commission Sendbox
- `insurance_premium` : Prime assurance

### Table `transactions`

- Historique de toutes les transactions
- Types : `payment`, `refund`, `payout`
- Status : `pending`, `completed`, `failed`, `refunded`
- Métadonnées Stripe (payment_intent_id, refund_id)

## 🛠️ API

### Routes

```typescript
// Créer Payment Intent
POST /api/payments/create-intent
Body: { booking_id: string }
Response: { clientSecret: string, amount: number }

// Webhook Stripe
POST /api/webhooks/stripe
Headers: { 'stripe-signature': string }
Body: Stripe Event (raw)
```

## 📝 Notes Importantes

1. **Mode Escrow** : Les fonds sont bloqués jusqu'à livraison confirmée
2. **Commission** : Prélevée automatiquement via Application Fee
3. **Assurance** : Optionnelle, calculée dynamiquement
4. **Webhooks** : Vérification signature obligatoire
5. **Idempotency** : Protection contre les doubles paiements

## 🧪 Tests et Développement

### Configuration automatique du webhook local

Au lieu de copier manuellement le secret webhook, utilisez le script automatique :

```bash
npm run stripe:listen
```

Ce script :
- Lance `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Détecte automatiquement le secret webhook (`whsec_...`)
- Met à jour `STRIPE_WEBHOOK_SECRET` dans `.env.local`
- Affiche les événements en temps réel

**Résultat attendu** :
```
🚀 Démarrage de stripe listen...
📡 URL du webhook: http://localhost:3000/api/webhooks/stripe
⏳ En attente du secret webhook...

> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx (^C to quit)
✅ STRIPE_WEBHOOK_SECRET mis à jour dans .env.local
✅ Configuration terminée!
```

### Tester les événements webhook

Déclencher des événements de test :

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

**Résultat attendu dans Terminal 1 (stripe listen)** :
```
2024-12-10 14:30:45  --> payment_intent.succeeded [evt_test_xxx]
2024-12-10 14:30:45  <-- [200] POST http://localhost:3000/api/webhooks/stripe [evt_test_xxx]
```

**Résultat attendu dans Terminal 2 (logs Next.js)** :
```
✅ Webhook reçu : payment_intent.succeeded
✅ Booking mis à jour : [id]
```

### Vérifier les workflows Stripe

Analyser tous les workflows Stripe dans le projet :

```bash
npm run stripe:check
```

Ce script identifie :
- Les événements webhook gérés
- Les appels API Stripe
- Les fonctions admin utilisant Stripe
- Les TODOs liés à Stripe

## 📋 Événements Webhook Gérés

| Événement | Description | Actions |
|-----------|-------------|---------|
| `payment_intent.succeeded` | Paiement réussi | Met à jour booking (`status: 'confirmed'`, `paid_at`), crée transaction, génère contrat PDF |
| `payment_intent.payment_failed` | Paiement échoué | Crée transaction avec status 'failed', log erreur |
| `charge.refunded` | Remboursement effectué | Crée transaction de refund, met à jour booking (`status: 'cancelled'`) |

## 🔗 Ressources

- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Elements](https://stripe.com/docs/stripe-js/react)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)




