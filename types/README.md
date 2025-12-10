# Types TypeScript - Sendbox

Ce dossier contient tous les types TypeScript pour le projet Sendbox, générés depuis Supabase et enrichis avec des types métier.

## 📁 Structure

```
types/
├── supabase.ts          # Types générés depuis Supabase (à régénérer)
├── database.types.ts     # Exports simplifiés des types DB
└── index.ts              # Types métier avec computed fields
```

## 🔄 Génération des Types depuis Supabase

### Prérequis

1. **Installer Supabase CLI** (si pas déjà fait) :

   ```bash
   brew install supabase/tap/supabase
   ```

2. **Se connecter à Supabase** :

   ```bash
   supabase login
   ```

   Cela ouvrira votre navigateur pour l'authentification.

3. **Lier le projet** :
   ```bash
   supabase link --project-ref tpvjycjlzxlbrtbvyfsx
   ```

### Générer les Types

Une fois connecté et lié, générez les types :

```bash
# Depuis la racine du projet
supabase gen types typescript --linked > types/supabase.ts
```

### Vérification

Après génération, vérifiez que :

- ✅ Le fichier `types/supabase.ts` a été mis à jour
- ✅ Aucune erreur TypeScript (`npm run build`)
- ✅ Les clients Supabase utilisent bien les types (`lib/supabase/*.ts`)

## 📚 Utilisation des Types

### Types de Base de Données

```typescript
import type { Profile, Announcement, Booking } from '@/types/database.types'

// Types de base (Row)
const profile: Profile = { ... }

// Types pour Insert
import type { ProfileInsert } from '@/types/database.types'
const newProfile: ProfileInsert = { user_id: '...' }

// Types pour Update
import type { ProfileUpdate } from '@/types/database.types'
const update: ProfileUpdate = { first_name: 'John' }
```

### Types Métier avec Computed Fields

```typescript
import type { Profile, Announcement, Booking } from '@/types'
import { createProfile, createAnnouncement, createBooking } from '@/types'

// Types enrichis avec computed fields
const profile: Profile = createProfile(profileBase)
// profile.full_name, profile.initials, profile.display_name

const announcement: Announcement = createAnnouncement(
  announcementBase,
  bookedKg
)
// announcement.remaining_kg, announcement.is_active, announcement.formatted_price

const booking: Booking = createBooking(bookingBase, pricePerKg)
// booking.total_price, booking.formatted_status, booking.is_pending
```

### Utilisation avec Supabase Client

```typescript
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

const supabase = await createClient()

// Autocomplete complet sur les tables
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// TypeScript connaît le type de `data`
if (data) {
  console.log(data.first_name) // ✅ Autocomplete
}
```

## 🎯 Types Disponibles

### Tables de Base

- `Profile` / `ProfileInsert` / `ProfileUpdate`
- `Announcement` / `AnnouncementInsert` / `AnnouncementUpdate`
- `Booking` / `BookingInsert` / `BookingUpdate`
- `Message` / `MessageInsert` / `MessageUpdate`
- `Notification` / `NotificationInsert` / `NotificationUpdate`
- `Rating` / `RatingInsert` / `RatingUpdate`
- `Transaction` / `TransactionInsert` / `TransactionUpdate`

### Types Métier (avec computed fields)

- `Profile` - avec `full_name`, `initials`, `display_name`
- `Announcement` - avec `remaining_kg`, `is_active`, `formatted_price`
- `Booking` - avec `total_price`, `formatted_status`, flags de statut
- `Message` - avec `is_read`, `formatted_date`, `time_ago`
- `Notification` - avec `is_read`, `formatted_date`, `action_url`
- `Rating` - avec `formatted_date`
- `Transaction` - avec `formatted_amount`, flags de statut

## 🔧 Helpers Disponibles

Tous les helpers sont exportés depuis `types/index.ts` :

- `createProfile(profile: ProfileBase): Profile`
- `createAnnouncement(announcement: AnnouncementBase, bookedKg?: number): Announcement`
- `createBooking(booking: BookingBase, pricePerKg?: number): Booking`
- `createMessage(message: MessageBase): Message`
- `createNotification(notification: NotificationBase): Notification`
- `createRating(rating: RatingBase): Rating`
- `createTransaction(transaction: TransactionBase): Transaction`

## ⚠️ Important

- **Ne modifiez jamais `types/supabase.ts` manuellement** - Il sera écrasé lors de la génération
- **Modifiez `types/index.ts`** pour ajouter des computed fields ou helpers
- **Régénérez les types** après chaque changement de schéma de base de données

## 🔄 Workflow Recommandé

1. Modifier le schéma dans `supabase/migrations/`
2. Appliquer la migration : `supabase db push --linked`
3. Régénérer les types : `supabase gen types typescript --linked > types/supabase.ts`
4. Vérifier que tout compile : `npm run build`
5. Adapter les types métier dans `types/index.ts` si nécessaire
