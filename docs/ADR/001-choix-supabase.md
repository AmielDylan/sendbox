# ADR-001 : Choix de Supabase comme Backend

**Date** : 2024-12-10
**Statut** : Accepté
**Décideurs** : Équipe Sendbox

## Contexte

Sendbox a besoin d'un backend robuste pour gérer :

- Authentification utilisateurs (email/password, OAuth)
- Base de données relationnelle (trajets, réservations, paiements)
- Storage de fichiers (KYC documents, photos colis)
- Messaging temps réel (chat)
- Webhooks (notifications, paiements Stripe)

Le projet était initialement sur **Xano** mais présentait des limitations.

## Décision

Migrer vers **Supabase** comme backend principal :

- PostgreSQL 15 (base de données)
- Supabase Auth (authentification JWT)
- Supabase Storage (fichiers)
- Supabase Realtime (WebSockets)
- Supabase Edge Functions (webhooks)

## Conséquences

### Positives ✅

**Open-Source & No Vendor Lock-in**

- Code source ouvert (MIT License)
- Données en PostgreSQL standard
- Migration facile si nécessaire

**Sécurité Native**

- Row Level Security (RLS) PostgreSQL
- Policies déclaratives
- JWT avec rotation automatique

**Performance & Scalabilité**

- PostgreSQL performant (scale horizontal)
- CDN intégré pour Storage
- Edge Functions distribuées

**Coût**

- Gratuit jusqu'à 500 MB + 2 GB bandwidth
- Scaling progressif (10$/mois → 25$/mois → custom)

**Écosystème**

- Excellent support Next.js (@supabase/ssr)
- CLI puissant (migrations, types)
- Documentation complète

### Négatives ❌

**Courbe d'Apprentissage**

- Nécessite connaissances PostgreSQL
- RLS policies peuvent être complexes
- Edge Functions = Deno (pas Node.js)

**Dépendance Infrastructure**

- Besoin Docker en local (supabase start)
- Hosting sur Supabase Cloud (ou self-hosted complexe)

**Limitations Tier Gratuit**

- 500 MB database (suffisant MVP, limité scale)
- 2 GB bandwidth/mois
- Edge Functions : 500K invocations/mois

## Alternatives Considérées

### Option 1 : Xano (ancien choix)

**Avantages**

- No-code friendly
- API générée automatiquement
- UI visuelle pour data modeling

**Inconvénients**

- ❌ Propriétaire (vendor lock-in fort)
- ❌ Pas de RLS natif
- ❌ Pas de Realtime
- ❌ Coût croissant rapide ($120+/mois scale)
- ❌ Migration difficile (format propriétaire)

**Raison du rejet** : Risque de vendor lock-in trop élevé pour un produit long terme.

### Option 2 : Firebase

**Avantages**

- Très rapide à setup
- Realtime natif
- Excellent pour prototypes

**Inconvénients**

- ❌ NoSQL (Firestore) : requêtes limitées
- ❌ Pas de relations SQL complexes
- ❌ Coût imprévisible (scaling)
- ❌ Vendor lock-in Google

**Raison du rejet** : NoSQL inadapté pour relations complexes (bookings, ratings, etc.).

### Option 3 : Backend Custom (Node.js + PostgreSQL)

**Avantages**

- Contrôle total
- Optimisations sur mesure
- Pas de vendor lock-in

**Inconvénients**

- ❌ Temps de dev x3 (auth, storage, realtime)
- ❌ Maintenance infrastructure
- ❌ Sécurité à gérer manuellement

**Raison du rejet** : Time-to-market trop long pour MVP.

## Références

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase vs Firebase](https://supabase.com/alternatives/supabase-vs-firebase)
- [Supabase Pricing](https://supabase.com/pricing)
- [Xano Limitations Discussion](https://www.reddit.com/r/nocode/comments/xano_vs_supabase/)








