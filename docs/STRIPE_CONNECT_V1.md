# Stripe Connect V1 — Sendbox (implémentation intégrée)

Objectif V1 : paiement capturé immédiatement, fonds retenus par la plateforme, transfert différé au voyageur après confirmation de dépôt/remise ou auto‑libération après 7 jours. Intégration **Express** (pas de wording “compte Stripe” côté utilisateur).  
Modèle de rôles **aligné** sur votre base : `user | partner | admin` (partner = voyageur).

---

## 1) Modèle de données (Postgres)

> Noms alignés sur votre schéma existant (`profiles`, `bookings`, `transactions`, etc.).  
> Les nouvelles tables peuvent être ajoutées en plus de `transactions` si vous voulez séparer paiement vs transfert.

### profiles
- id (uuid, pk)
- role (enum `user | partner | admin`)
- kyc_status (enum existant)
- stripe_connect_account_id (text, unique, nullable)
- stripe_payouts_enabled (boolean, default false)
- stripe_onboarding_completed (boolean, default false)
- stripe_requirements (jsonb, nullable) — snapshot `requirements` Stripe
- created_at, updated_at

### bookings (déjà existant)
Ajouter/normaliser :
- status (enum booking_status)
- total_amount (numeric)
- platform_fee (numeric)
- traveler_amount (numeric)
- currency (text, default 'EUR')
- captured_at (timestamptz)
- deposit_confirmed_at (timestamptz)
- released_at (timestamptz)

### payments (nouvelle table recommandée)
- id (uuid, pk)
- booking_id (fk)
- stripe_payment_intent_id (text)
- amount_total (numeric)
- platform_fee (numeric)
- currency (text)
- status (enum payment_status)
- captured_at (timestamptz)
- created_at

### transfers (nouvelle table recommandée)
- id (uuid, pk)
- booking_id (fk)
- stripe_transfer_id (text)
- amount (numeric)
- status (enum transfer_status)
- attempted_at (timestamptz)
- created_at

### disputes
- id (uuid, pk)
- booking_id (fk)
- status (enum dispute_status)
- reason (text)
- opened_at (timestamptz)
- resolved_at (timestamptz)

### Enums recommandés
- booking_status: DRAFT, PENDING_PAYMENT, PAID_HELD, DEPOSIT_CONFIRMED, DISPUTE_OPEN, RELEASED_TO_TRAVELER, REFUNDED, CANCELED
- payment_status: REQUIRES_PAYMENT_METHOD, REQUIRES_CONFIRMATION, SUCCEEDED, REFUNDED, PARTIALLY_REFUNDED
- transfer_status: PENDING, PAID, FAILED, REVERSED
- dispute_status: NONE, OPEN, WON_BY_SENDER, WON_BY_TRAVELER, RESOLVED

---

## 2) API Routes (REST)

### POST /connect/onboard (partner)
Crée un compte Express si absent, puis génère un Account Link.
Response:
```json
{ "url": "https://connect.stripe.com/..." }
```
Idempotency: `profile.id` (réutiliser le même `stripe_connect_account_id`).

### GET /connect/status (partner)
Response:
```json
{
  "payouts_enabled": true,
  "onboarding_completed": true,
  "requirements": { "...": "..." }
}
```

### POST /bookings
Crée la réservation (draft / pending payment).

### POST /bookings/{id}/pay
Crée + confirme un PaymentIntent (capture automatique).  
Response:
```json
{ "client_secret": "pi_..._secret_..." }
```
Idempotency: `booking_id` (pas de double paiement).

### POST /bookings/{id}/confirm-deposit (sender)
Marque la remise confirmée et déclenche le transfert si possible.

### POST /bookings/{id}/open-dispute (sender)
Gèle la libération et crée une dispute.

### POST /webhooks/stripe
Gère :
`payment_intent.succeeded`, `charge.refunded`, `account.updated`, `transfer.*`, `payout.failed`.

---

## 3) Stripe Objects & Flow (best practices)

### Onboarding Express (Stripe Node)
Utiliser la v2 core API (recommandée) :
```ts
const account = await stripe.v2.core.accounts.create({
  email,
  type: 'express',
  country: 'FR',
  capabilities: { transfers: { requested: true } },
})

const accountLink = await stripe.v2.core.accountLinks.create({
  account: account.id,
  type: 'account_onboarding',
  return_url,
  refresh_url,
})
```

### Paiement (platform)
- PaymentIntent sur le compte plateforme.
- capture_method = `automatic`
- metadata: booking_id, sender_id, traveler_id

### Hold (sans transfert)
- À `payment_intent.succeeded`, marquer `booking.status = PAID_HELD`.
- Aucune sortie de fonds vers le partner tant que la remise n’est pas confirmée.

### Libération
**A)** `confirm-deposit` → transfert si `payouts_enabled` et pas de litige  
**B)** Job à J+7 → transfert auto si `payouts_enabled` et pas de litige

### Transfer (separate charges & transfers)
```ts
await stripe.transfers.create({
  amount: traveler_amount,
  currency: 'eur',
  destination: stripe_connect_account_id,
  metadata: { booking_id },
})
```
La commission plateforme reste sur le solde Sendbox.

### Refund / Dispute
Si litige en faveur du sender :
- **avant transfert** : refund PaymentIntent
- **après transfert** : reversal du transfert si possible + marquage `owed`

---

## 4) Jobs & Automations

- **Daily release job** : `PAID_HELD` + `captured_at <= now - 7 days` + pas de litige → transfert
- **Retry transfer job** : transferts `PENDING` si `payouts_enabled` devient true

---

## 5) UX Copy (FR, intégré)
- Activer les paiements
- Ajouter votre compte bancaire
- Vérification d’identité
- Paiement sécurisé, libéré après confirmation ou automatiquement sous 7 jours

---

## 6) Edge cases

- Partner non onboardé au moment de la libération → garder `PAID_HELD` + notification
- Confirmation dépôt après ouverture litige → refuser
- Partial refunds (assurance/commission) → ajuster payments/transfers
- Chargeback → geler la libération + ouvrir dispute
- Multi‑currency → V1 EUR only
- Idempotency + unique constraints (no double payout)
