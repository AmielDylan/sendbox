# Workflow et Configuration Stripe

## 🔄 Workflow Complet des Réservations

### 1. Création de la demande (SENDER)
**Page:** `/dashboard/colis/new` (BookingForm)
- L'expéditeur remplit le formulaire avec les détails du colis
- Une demande de réservation est créée avec `status = 'pending'`
- Une notification est envoyée au voyageur (créateur de l'annonce)

**Code:**
```typescript
// lib/core/bookings/actions.ts: createBookingRequest()
- Crée le booking avec status='pending'
- Envoie notification au traveler_id
```

---

### 2. Acceptation/Refus (TRAVELER)
**Page:** `/dashboard/messages` (onglet "Demandes")
- Le voyageur voit la liste des demandes en attente
- Il peut accepter ou refuser chaque demande

#### 2a. Si ACCEPTÉE
```typescript
// lib/core/bookings/requests.ts: acceptBooking()
- Met à jour: status='accepted', accepted_at=NOW
- Envoie notification à sender_id: "Demande acceptée. Veuillez procéder au paiement"
- Déclenche trigger update_announcement_status() qui met à jour available_kg
```

**Côté expéditeur après acceptation:**
- Reçoit notification
- Peut voir le booking avec status='accepted' dans `/dashboard/colis`
- **DOIT PAYER** via le bouton "Payer maintenant" → `/dashboard/colis/[id]/paiement`

#### 2b. Si REFUSÉE
```typescript
// lib/core/bookings/requests.ts: refuseBooking()
- Met à jour: status='cancelled', refused_at=NOW, refused_reason
- Envoie notification à sender_id avec la raison du refus
```

**Côté expéditeur après refus:**
- Reçoit notification avec raison
- Le booking apparaît avec status='cancelled'
- Peut créer une nouvelle demande sur une autre annonce

---

### 3. Paiement (SENDER)
**Page:** `/dashboard/colis/[id]/paiement`

**Flow actuel:**
```typescript
// app/api/payments/create-intent/route.ts
1. Crée un PaymentIntent Stripe
2. Calcule: total_price, commission_amount, insurance_premium
3. Met à jour le booking avec ces montants
4. Retourne clientSecret pour Stripe Elements

// components/features/payments/PaymentForm.tsx
1. Formulaire Stripe Elements
2. Confirmation du paiement
3. Webhook Stripe met à jour: payment_intent_id, paid_at, status='paid'
```

**⚠️ PROBLÈME ACTUEL:**
Après le paiement réussi, le statut passe à `paid` mais:
- **Pas de notification à l'expéditeur** confirmant le paiement
- **Pas de notification au voyageur** l'informant que le paiement est effectué
- **Pas de génération automatique du QR code** (devrait être fait par trigger)

---

### 4. Après Paiement - QR Code et Contrat
**Page:** `/dashboard/colis/[id]`

**Ce qui devrait se passer automatiquement:**
```sql
-- supabase/migrations: Trigger sur bookings
-- Quand status passe à 'paid', génère automatiquement le QR code
```

**Actions disponibles pour l'expéditeur:**
- Voir le contrat de transport: `/dashboard/colis/[id]/contrat`
- Voir le QR code: `/dashboard/colis/[id]/qr`

**Actions disponibles pour le voyageur:**
- Voir le contrat de transport
- Scanner le QR code au dépôt: `/dashboard/scan/depot/[id]`

---

### 5. Dépôt du Colis (TRAVELER)
**Page:** `/dashboard/scan/depot/[booking_id]`

**Flow:**
```typescript
// lib/core/bookings/qr-scan.ts: handleDepositScan()
1. Le voyageur scanne le QR code de l'expéditeur
2. Demande signature électronique
3. Génère PDF "Preuve de dépôt"
4. Met à jour: status='deposited', deposited_at=NOW
5. Envoie notification à l'expéditeur
```

**⚠️ PROBLÈME ACTUEL:**
- Pas de notification automatique à l'expéditeur après le dépôt

---

### 6. Transit (TRAVELER)
**Statut:** `in_transit`
- Le voyageur a le colis et voyage
- L'expéditeur peut suivre l'état dans `/dashboard/colis`

---

### 7. Livraison (TRAVELER)
**Page:** `/dashboard/scan/livraison/[booking_id]`

**Flow:**
```typescript
// lib/core/bookings/qr-scan.ts: handleDeliveryScan()
1. Le voyageur arrive à destination
2. Scanne le QR code pour la livraison
3. Le destinataire signe électroniquement
4. Génère PDF "Preuve de livraison"
5. Met à jour: status='delivered', delivered_at=NOW
6. Déclenche le paiement au voyageur (Stripe Connect)
```

**⚠️ PROBLÈME ACTUEL:**
- Pas de notification aux deux parties
- Paiement au voyageur non implémenté (nécessite Stripe Connect)

---

### 8. Notation (BOTH)
**Page:** `/dashboard/colis/[id]/noter`

**Flow:**
```typescript
// lib/core/ratings/actions.ts: submitRating()
1. L'expéditeur note le voyageur (1-5 étoiles + commentaire)
2. Le voyageur note l'expéditeur
3. Les notes sont publiées sur les profils publics
```

---

## 💳 Stripe Configuration

### Mode Test (Développement)
Vous utilisez **Stripe Test Mode**, ce qui est parfait pour le développement !

**Clés actuelles (.env.local):**
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Pour tester les paiements:

1. **Cartes de test Stripe:**
   - Succès: `4242 4242 4242 4242`
   - Échec: `4000 0000 0000 0002`
   - 3D Secure: `4000 0027 6000 3184`
   - Date expiration: N'importe quelle date future
   - CVC: N'importe quel 3 chiffres

2. **Webhooks locaux (Stripe CLI):**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Tester un paiement:**
   - Créer une annonce
   - Créer une demande de réservation
   - Accepter la demande
   - Aller sur `/dashboard/colis/[id]/paiement`
   - Utiliser une carte test Stripe
   - Le webhook met à jour le booking automatiquement

### ⚠️ Problème: Commission

**Code actuel (commenté):**
```typescript
// app/api/payments/create-intent/route.ts:108
// application_fee_amount: toStripeAmount(amounts.commissionAmount),
```

**Pourquoi commenté?**
`application_fee_amount` nécessite **Stripe Connect**:
- Le compte Stripe doit être un "Platform Account"
- Chaque voyageur doit avoir un "Connected Account"
- Les paiements sont split automatiquement

**Solutions:**

#### Option 1: Sans Stripe Connect (Temporaire)
```typescript
// Garder la commission dans les métadonnées
metadata: {
  commission_amount: '500', // 5.00€
}

// Après livraison, créer un payout manuel au voyageur
// total_price - commission_amount = montant voyageur
```

#### Option 2: Avec Stripe Connect (Recommandé pour production)
```typescript
// 1. Créer un Connect Account pour chaque voyageur
const account = await stripe.accounts.create({
  type: 'express',
  country: 'FR',
  email: traveler.email,
})

// 2. Générer un lien d'onboarding
const accountLink = await stripe.accountLinks.create({
  account: account.id,
  refresh_url: 'https://sendbox.com/dashboard/reglages/paiements',
  return_url: 'https://sendbox.com/dashboard',
  type: 'account_onboarding',
})

// 3. Créer le PaymentIntent avec transfer
const paymentIntent = await stripe.paymentIntents.create({
  amount: 10000, // 100.00€
  currency: 'eur',
  application_fee_amount: 500, // 5% commission = 5.00€
  transfer_data: {
    destination: travelerConnectedAccountId,
  },
})
```

**Pour activer Stripe Connect:**
1. Aller sur Dashboard Stripe → Connect
2. Activer "Express" ou "Custom" accounts
3. Implémenter l'onboarding des voyageurs
4. Modifier `/api/payments/create-intent` pour utiliser `transfer_data`

### En développement:
- Vous pouvez tester **sans Stripe Connect**
- Les paiements fonctionnent normalement
- La commission est juste trackée dans les métadonnées
- Pour production, il faudra implémenter Stripe Connect

---

## 🚨 Problèmes à Résoudre

### 1. Notifications manquantes
- ✅ Acceptation → Notification à l'expéditeur ✓
- ✅ Refus → Notification à l'expéditeur ✓
- ❌ Paiement réussi → Notification aux deux parties
- ❌ Dépôt → Notification à l'expéditeur
- ❌ Livraison → Notification aux deux parties

### 2. QR Code
- ❌ Pas de génération automatique après paiement
- Trigger existe mais peut-être cassé: `generate_qr_code_for_booking()`

### 3. Stripe Connect
- ❌ Commission non prélevée automatiquement
- ❌ Paiement au voyageur non automatisé

### 4. Email
- ❌ Aucun email envoyé (tous les TODOs dans le code)

---

## 📋 Recommandations

### Court terme (MVP):
1. ✅ Fix affichage kilos/prix (FAIT)
2. ✅ Fix déconnexion automatique (FAIT)
3. ⏳ Ajouter notifications manquantes
4. ⏳ Vérifier/Fix trigger QR code
5. ⏳ Documenter le flow complet pour les utilisateurs

### Moyen terme:
1. Implémenter Stripe Connect
2. Ajouter envoi d'emails (SendGrid/Resend)
3. Ajouter historique des transactions
4. Dashboard admin pour gérer les litiges

### Long terme:
1. Notifications push (FCM)
2. SMS pour événements critiques
3. Tracking GPS en temps réel
4. Assurance intégrée avec partenaire
