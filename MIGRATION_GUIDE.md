# 📚 Guide de Migration des Imports

Ce guide vous aide à migrer vos imports vers la nouvelle architecture.

---

## 🎯 Objectif

Passer de l'ancienne structure plate à une architecture **Domain-Driven** :

```
❌ AVANT: lib/actions/announcement.ts
✅ APRÈS: lib/core/announcements/actions.ts
```

---

## 📋 Table de Correspondance

### Actions (`lib/actions/` → `lib/core/{domain}/`)

| Ancien chemin | Nouveau chemin |
|--------------|----------------|
| `lib/actions/announcement.ts` | `lib/core/announcements/actions.ts` |
| `lib/actions/announcement-management.ts` | `lib/core/announcements/management.ts` |
| `lib/actions/announcement-views.ts` | `lib/core/announcements/views.ts` |
| `lib/actions/auth.ts` | `lib/core/auth/actions.ts` |
| `lib/actions/bookings.ts` | `lib/core/bookings/actions.ts` |
| `lib/actions/booking-requests.ts` | `lib/core/bookings/requests.ts` |
| `lib/actions/booking-workflow.ts` | `lib/core/bookings/workflow.ts` |
| `lib/actions/qr-scan.ts` | `lib/core/bookings/qr-scan.ts` |
| `lib/actions/kyc.ts` | `lib/core/kyc/actions.ts` |
| `lib/actions/messages.ts` | `lib/core/messages/actions.ts` |
| `lib/actions/notifications.ts` | `lib/core/notifications/actions.ts` |
| `lib/actions/profile.ts` | `lib/core/profile/actions.ts` |
| `lib/actions/rating.ts` | `lib/core/ratings/actions.ts` |
| `lib/actions/admin.ts` | `lib/core/admin/actions.ts` |
| `lib/actions/pdf-generation.ts` | `lib/shared/services/pdf/generation.ts` |

### Validations (`lib/validations/` → `lib/core/{domain}/`)

| Ancien chemin | Nouveau chemin |
|--------------|----------------|
| `lib/validations/announcement.ts` | `lib/core/announcements/validations.ts` |
| `lib/validations/auth.ts` | `lib/core/auth/validations.ts` |
| `lib/validations/booking.ts` | `lib/core/bookings/validations.ts` |
| `lib/validations/kyc.ts` | `lib/core/kyc/validations.ts` |
| `lib/validations/profile.ts` | `lib/core/profile/validations.ts` |
| `lib/validations/rating.ts` | `lib/core/ratings/validations.ts` |

### Utilitaires (`lib/utils/` → selon le contexte)

| Ancien chemin | Nouveau chemin |
|--------------|----------------|
| `lib/utils/auth.ts` | `lib/core/auth/utils.ts` |
| `lib/utils/avatar.ts` | `lib/core/profile/utils.ts` |
| `lib/utils/booking-calculations.ts` | `lib/core/bookings/calculations.ts` |
| `lib/utils/package-photos.ts` | `lib/core/bookings/photos.ts` |
| `lib/utils/qr-codes.ts` | `lib/core/bookings/qr-codes.ts` |
| `lib/utils/payment-calculations.ts` | `lib/core/payments/calculations.ts` |
| `lib/utils/cities.ts` | `lib/shared/utils/cities.ts` |
| `lib/utils/file-upload.ts` | `lib/shared/utils/files.ts` |
| `lib/utils/email.ts` | `lib/shared/services/email/client.ts` |

### Configuration & Services

| Ancien chemin | Nouveau chemin |
|--------------|----------------|
| `lib/supabase/client.ts` | `lib/shared/db/client.ts` |
| `lib/supabase/server.ts` | `lib/shared/db/server.ts` |
| `lib/config/features.ts` | `lib/shared/config/features.ts` |
| `lib/stripe/config.ts` | `lib/shared/services/stripe/config.ts` |

---

## 🔄 Exemples de Migration

### Exemple 1: Importer des actions d'annonces

```typescript
// ❌ AVANT
import { createAnnouncement } from '@/lib/actions/announcement'
import { deleteAnnouncement } from '@/lib/actions/announcement-management'
import { getAnnouncementById } from '@/lib/actions/announcement-views'

// ✅ APRÈS (imports individuels)
import { createAnnouncement } from '@/lib/core/announcements/actions'
import { deleteAnnouncement } from '@/lib/core/announcements/management'
import { getAnnouncementById } from '@/lib/core/announcements/views'

// 🌟 MIEUX (import centralisé)
import { 
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementById 
} from '@/lib/core/announcements'
```

### Exemple 2: Importer validations et actions ensemble

```typescript
// ❌ AVANT
import { createBooking } from '@/lib/actions/bookings'
import { bookingSchema } from '@/lib/validations/booking'
import { calculatePrice } from '@/lib/utils/booking-calculations'

// ✅ APRÈS (import centralisé)
import { 
  createBooking,
  bookingSchema,
  calculatePrice 
} from '@/lib/core/bookings'
```

### Exemple 3: Importer services partagés

```typescript
// ❌ AVANT
import { createClient } from '@/lib/supabase/client'
import { sendEmail } from '@/lib/utils/email'
import { isFeatureEnabled } from '@/lib/config/features'

// ✅ APRÈS (imports ciblés)
import { createClient } from '@/lib/shared/db/client'
import { sendEmail } from '@/lib/shared/services/email/client'
import { isFeatureEnabled } from '@/lib/shared/config/features'

// 🌟 MIEUX (import centralisé si disponible)
import { createClient, sendEmail, isFeatureEnabled } from '@/lib/shared'
```

---

## 🛠️ Script de Migration Automatique

Créer un script `update-imports.sh` :

```bash
#!/bin/bash

# Migration automatique des imports
# ⚠️ Faire un backup avant d'exécuter !

find app components hooks -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
  # Announcements
  sed -i '' 's|@/lib/actions/announcement"|@/lib/core/announcements/actions"|g' "$file"
  sed -i '' 's|@/lib/validations/announcement"|@/lib/core/announcements/validations"|g' "$file"
  
  # Bookings
  sed -i '' 's|@/lib/actions/bookings"|@/lib/core/bookings/actions"|g' "$file"
  sed -i '' 's|@/lib/actions/booking-requests"|@/lib/core/bookings/requests"|g' "$file"
  sed -i '' 's|@/lib/actions/booking-workflow"|@/lib/core/bookings/workflow"|g' "$file"
  sed -i '' 's|@/lib/validations/booking"|@/lib/core/bookings/validations"|g' "$file"
  
  # Auth
  sed -i '' 's|@/lib/actions/auth"|@/lib/core/auth/actions"|g' "$file"
  sed -i '' 's|@/lib/validations/auth"|@/lib/core/auth/validations"|g' "$file"
  
  # KYC
  sed -i '' 's|@/lib/actions/kyc"|@/lib/core/kyc/actions"|g' "$file"
  sed -i '' 's|@/lib/validations/kyc"|@/lib/core/kyc/validations"|g' "$file"
  
  # Profile
  sed -i '' 's|@/lib/actions/profile"|@/lib/core/profile/actions"|g' "$file"
  sed -i '' 's|@/lib/validations/profile"|@/lib/core/profile/validations"|g' "$file"
  
  # Messages
  sed -i '' 's|@/lib/actions/messages"|@/lib/core/messages/actions"|g' "$file"
  
  # Notifications  
  sed -i '' 's|@/lib/actions/notifications"|@/lib/core/notifications/actions"|g' "$file"
  
  # Ratings
  sed -i '' 's|@/lib/actions/rating"|@/lib/core/ratings/actions"|g' "$file"
  sed -i '' 's|@/lib/validations/rating"|@/lib/core/ratings/validations"|g' "$file"
  
  # Admin
  sed -i '' 's|@/lib/actions/admin"|@/lib/core/admin/actions"|g' "$file"
  
  # Supabase → DB
  sed -i '' 's|@/lib/supabase/client"|@/lib/shared/db/client"|g' "$file"
  sed -i '' 's|@/lib/supabase/server"|@/lib/shared/db/server"|g' "$file"
  
  # Config
  sed -i '' 's|@/lib/config/features"|@/lib/shared/config/features"|g' "$file"
  
  echo "✓ Migrated: $file"
done

echo "✅ Migration terminée !"
echo "⚠️  Vérifier avec: npm run build"
```

---

## ✅ Checklist de Migration

### Phase 1: Préparation
- [ ] Créer une branche git: `git checkout -b refactor/new-architecture`
- [ ] Faire un backup du projet
- [ ] Commit tous les changements en cours

### Phase 2: Migration des imports
- [ ] Exécuter le script de migration automatique
- [ ] Vérifier manuellement les imports complexes
- [ ] Corriger les imports cassés

### Phase 3: Vérification
- [ ] `npm run build` - Build réussi
- [ ] `npm run lint` - Pas d'erreurs
- [ ] `npm run test:e2e` - Tests passent
- [ ] Tester manuellement l'application

### Phase 4: Nettoyage
- [ ] Supprimer les anciens fichiers dans `lib/actions/`
- [ ] Supprimer les anciens fichiers dans `lib/validations/`
- [ ] Supprimer les anciens fichiers dans `lib/utils/`
- [ ] Supprimer `lib/supabase/` (remplacé par `lib/shared/db/`)

### Phase 5: Documentation
- [ ] Mettre à jour les README si nécessaire
- [ ] Documenter les nouveaux patterns
- [ ] Former l'équipe à la nouvelle structure

---

## 🚨 Points d'Attention

### 1. Imports circulaires
Éviter les imports circulaires entre domaines :

```typescript
// ❌ MAUVAIS
// lib/core/bookings/actions.ts
import { getUserById } from '@/lib/core/profile/actions'

// lib/core/profile/actions.ts
import { getBookingsByUser } from '@/lib/core/bookings/actions'

// ✅ BON
// Créer un service partagé ou utiliser les queries DB
```

### 2. Dépendances externes
Les services externes (Stripe, Supabase) doivent être dans `lib/shared/services/`

### 3. Utilitaires génériques
Les fonctions vraiment génériques vont dans `lib/shared/utils/`, pas dans un domaine spécifique

---

## 📞 Support

En cas de problème :
1. Vérifier la table de correspondance ci-dessus
2. Consulter `ARCHITECTURE.md`
3. Chercher les exemples dans le code migré

---

**Note** : Cette migration peut prendre du temps. Il est recommandé de la faire progressivement, domaine par domaine.

