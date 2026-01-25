# Guide de Test - Vérification KYC avec Stripe Identity

Ce guide explique comment tester le flux de vérification KYC avec Stripe Identity en local et en production.

---

## 📋 Prérequis

- Stripe CLI installé (`brew install stripe/stripe-cli/stripe`)
- Compte Stripe configuré (test mode)
- Variables d'environnement Stripe configurées

---

## ✅ Vérification de la Configuration

### 1. Vérifier les variables d'environnement

Assurez-vous que votre fichier `.env.local` contient :

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 2. Vérifier le webhook secret actuel

```bash
grep "STRIPE_WEBHOOK_SECRET" .env.local
```

**Résultat attendu** : `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## 🚀 Méthode 1 : Test automatique avec `dev:stripe`

C'est la méthode **recommandée** pour le développement local.

### Démarrer le serveur avec webhooks automatiques

```bash
npm run dev:stripe
```

Ce script :
1. ✅ Lance Stripe CLI
2. ✅ Configure automatiquement le webhook forwarding
3. ✅ Met à jour `.env.local` avec le secret temporaire
4. ✅ Démarre Next.js avec la configuration correcte

### Tester le flux KYC

1. Ouvrir http://localhost:3000/dashboard/reglages/kyc
2. Sélectionner un type de document (Passeport ou Carte d'identité)
3. Choisir un pays
4. Cliquer sur "Vérifier mon identité"
5. Compléter le flux Stripe Identity (mode test)

### Documents de test Stripe

En mode test, Stripe accepte des documents fictifs :

- **Succès** : Utiliser les documents de test fournis par Stripe
- **Échec** : Utiliser un document expiré ou invalide

### Surveiller les webhooks en temps réel

Dans le terminal où tourne `npm run dev:stripe`, vous verrez :

```
[Stripe CLI] > POST /api/webhooks/stripe [200]
```

---

## 🔧 Méthode 2 : Test manuel avec Stripe CLI

### 1. Démarrer le forwarding manuellement

Dans un terminal séparé :

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 2. Copier le webhook secret

La commande affiche :
```
> Ready! Your webhook signing secret is whsec_...
```

### 3. Mettre à jour `.env.local`

```bash
STRIPE_WEBHOOK_SECRET=whsec_...  # Remplacer par le secret affiché
```

### 4. Redémarrer Next.js

```bash
npm run dev
```

---

## 🧪 Test des Événements Webhooks

### ⚠️ Limitation Importante

**Stripe Identity en mode test NE DÉCLENCHE PAS automatiquement les webhooks** après avoir complété le flux de vérification dans l'interface Stripe.

Les webhooks Stripe Identity fonctionnent uniquement en production ou via l'API Stripe directement.

### Événements à tester

| Événement | Déclencheur | Statut KYC attendu |
|-----------|-------------|-------------------|
| `identity.verification_session.processing` | Soumission du document | `pending` |
| `identity.verification_session.verified` | Validation réussie | `approved` |
| `identity.verification_session.requires_input` | Document rejeté | `rejected` |
| `identity.verification_session.canceled` | Annulation par l'utilisateur | `incomplete` |
| `identity.verification_session.redacted` | Données supprimées | `incomplete` |

### Simuler un événement manuellement

⚠️ **Note** : `stripe trigger identity.verification_session.*` n'est pas supporté par Stripe CLI.

**Solution** : Utiliser le script de test fourni :

```bash
# Mettre le statut à "approved"
npx tsx scripts/set-kyc-status.ts approved

# Mettre le statut à "rejected"
npx tsx scripts/set-kyc-status.ts rejected

# Mettre le statut à "pending"
npx tsx scripts/set-kyc-status.ts pending

# Mettre le statut à "incomplete"
npx tsx scripts/set-kyc-status.ts incomplete
```

Ce script met à jour directement la base de données et déclenche Supabase Realtime.

---

## 🔍 Diagnostic des Problèmes

### Problème : Le statut KYC ne se met pas à jour

**Causes possibles** :

1. **Webhook secret invalide**
   ```bash
   # Vérifier les logs du webhook
   tail -f .next/server.log | grep webhook
   ```

2. **Stripe CLI non démarré**
   ```bash
   # Vérifier si Stripe CLI écoute
   ps aux | grep "stripe listen"
   ```

3. **Événements non reçus**
   ```bash
   # Vérifier les événements Stripe
   stripe events list --limit 10
   ```

### Problème : Erreur 400 dans les webhooks

**Solution** : Le webhook secret est probablement incorrect.

```bash
# Redémarrer avec le bon secret
npm run dev:stripe
```

### Problème : Realtime ne fonctionne pas

**Vérification** :

1. Ouvrir la console navigateur (F12)
2. Chercher les logs : `❌ Realtime KYC subscription error`
3. Vérifier que Supabase Realtime est activé dans le dashboard

---

## 🔔 Vérifier les Notifications

Après chaque changement de statut KYC, le système doit :

1. ✅ Mettre à jour `kyc_status` dans la table `profiles`
2. ✅ Créer une notification système dans la table `notifications`
3. ✅ Déclencher la mise à jour en temps réel sur la page KYC
4. ✅ Afficher une alerte visuelle dans le dashboard

### Vérifier les notifications créées

Dans Supabase :

```sql
SELECT * FROM notifications
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🌐 Configuration Production

### 1. Configurer le webhook dans Stripe Dashboard

1. Aller sur https://dashboard.stripe.com/webhooks
2. Cliquer "Add endpoint"
3. URL : `https://VOTRE_DOMAINE/api/webhooks/stripe`
4. Événements à écouter :
   - `identity.verification_session.processing`
   - `identity.verification_session.verified`
   - `identity.verification_session.requires_input`
   - `identity.verification_session.canceled`
   - `identity.verification_session.redacted`

### 2. Récupérer le webhook secret

Après création, Stripe affiche le secret : `whsec_...`

### 3. Configurer les variables de production

Dans votre plateforme d'hébergement (Vercel, etc.) :

```bash
STRIPE_WEBHOOK_SECRET=whsec_PRODUCTION_SECRET
```

---

## 📊 Monitoring

### Logs à surveiller

```bash
# Succès
✅ Webhook signature verification successful
✅ KYC status updated to approved

# Erreurs
❌ Missing user_id in verification session metadata
❌ Failed to update KYC status (verified)
❌ Notification creation failed (non-blocking)
```

### Dashboard Stripe

- Aller sur https://dashboard.stripe.com/events
- Filtrer par type : `identity.verification_session.*`
- Vérifier le statut de livraison des webhooks

---

## 🎯 Checklist de Test Complet

### Test du Flux Complet (Développement)

- [ ] Lancer `npm run dev` (ou `npm run dev:stripe`)
- [ ] Ouvrir http://localhost:3000/dashboard/reglages/kyc
- [ ] Vérifier l'état initial (badge "À compléter" en orange)
- [ ] Dans un terminal : `npx tsx scripts/set-kyc-status.ts approved`
- [ ] **Sans recharger la page**, vérifier que le badge passe à "Approuvé" (vert)
- [ ] Vérifier la notification système dans le dashboard
- [ ] Tester les autres statuts : `rejected`, `pending`, `incomplete`
- [ ] Vérifier que chaque changement se reflète en temps réel

### Test du Flux Stripe Identity (Optionnel)

- [ ] Lancer `npm run dev:stripe`
- [ ] Aller sur la page KYC
- [ ] Sélectionner un document et un pays
- [ ] Cliquer sur "Vérifier mon identité"
- [ ] Compléter le flux Stripe (mode test)
- [ ] Vérifier que le flux se termine sans erreur
- [ ] ⚠️ Le statut ne changera PAS automatiquement (limitation Stripe test)
- [ ] Utiliser le script pour simuler l'approval

### Test en Production

- [ ] Configurer le webhook dans Stripe Dashboard
- [ ] Déployer l'application
- [ ] Faire une vérification réelle
- [ ] Vérifier que les webhooks arrivent
- [ ] Vérifier les logs dans Stripe Dashboard → Events
- [ ] Confirmer que le statut se met à jour automatiquement

---

## 🆘 Support

Si les problèmes persistent :

1. Vérifier les logs du webhook : `app/api/webhooks/stripe/route.ts`
2. Consulter les événements Stripe : https://dashboard.stripe.com/events
3. Tester avec `stripe trigger` pour isoler le problème

---

**Note** : En mode test, les vérifications sont simulées et ne nécessitent pas de vrais documents.
