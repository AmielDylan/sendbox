# Guide des Fonctions RPC Supabase

## Qu'est-ce qu'une fonction RPC ?

**RPC** signifie **Remote Procedure Call** (Appel de Procédure à Distance). Dans Supabase, les fonctions RPC sont des fonctions PostgreSQL que vous pouvez appeler directement via l'API REST ou le client JavaScript.

### Avantages des fonctions RPC

1. **Logique métier côté serveur** : Exécution dans la base de données (plus rapide)
2. **Sécurité** : Contrôle d'accès via RLS et `SECURITY DEFINER`
3. **Performance** : Moins de round-trips réseau
4. **Réutilisabilité** : Une fonction peut être appelée depuis plusieurs endroits

## Fonctions RPC dans Sendbox

### 1. Recherche d'annonces

#### `search_announcements`
Recherche et filtre les annonces avec score de matching.

**Paramètres :**
- `p_departure_country` (TEXT, optionnel)
- `p_arrival_country` (TEXT, optionnel)
- `p_departure_date` (DATE, optionnel)
- `p_min_kg` (INTEGER, optionnel)
- `p_sort_by` (TEXT, défaut: 'date') - 'date', 'price', 'rating'
- `p_limit` (INTEGER, défaut: 10)
- `p_offset` (INTEGER, défaut: 0)

**Retourne :** Table avec colonnes (id, traveler_id, origin_country, etc. + match_score)

**Exemple d'utilisation :**
```typescript
const { data, error } = await supabase.rpc('search_announcements', {
  p_departure_country: 'FR',
  p_arrival_country: 'BJ',
  p_departure_date: '2025-12-20',
  p_min_kg: 10,
  p_sort_by: 'price',
  p_limit: 10,
  p_offset: 0
})
```

#### `count_search_announcements`
Compte le nombre total d'annonces correspondant aux critères.

**Paramètres :**
- `p_departure_country` (TEXT, optionnel)
- `p_arrival_country` (TEXT, optionnel)
- `p_departure_date` (DATE, optionnel)
- `p_min_kg` (INTEGER, optionnel)

**Retourne :** INTEGER

---

### 2. Notifications

#### `create_notification`
Crée une notification pour un utilisateur.

**Paramètres :**
- `p_user_id` (UUID, requis)
- `p_type` (TEXT, requis) - 'booking_request', 'payment_confirmed', etc.
- `p_title` (TEXT, requis)
- `p_content` (TEXT, requis)
- `p_booking_id` (UUID, optionnel)
- `p_announcement_id` (UUID, optionnel)

**Retourne :** UUID (ID de la notification créée)

**Sécurité :** `SECURITY DEFINER` - Exécute avec les privilèges du créateur

**Exemple :**
```typescript
const { data, error } = await supabase.rpc('create_notification', {
  p_user_id: 'user-uuid',
  p_type: 'booking_request',
  p_title: 'Nouvelle demande',
  p_content: 'Vous avez reçu une nouvelle demande de réservation',
  p_booking_id: 'booking-uuid'
})
```

#### `count_unread_notifications`
Compte les notifications non lues d'un utilisateur.

**Paramètres :**
- `p_user_id` (UUID, requis)

**Retourne :** INTEGER

---

### 3. Vues d'annonces

#### `increment_announcement_views`
Incrémente le compteur de vues d'une annonce.

**Paramètres :**
- `p_announcement_id` (UUID, requis)

**Retourne :** VOID

---

### 4. Ratings

#### `increment_completed_services`
Incrémente le compteur de services complétés d'un utilisateur.

**Paramètres :**
- `p_user_id` (UUID, requis)

**Retourne :** VOID

---

### 5. Messages/Chat

#### `get_user_conversations`
Récupère la liste des conversations d'un utilisateur.

**Paramètres :**
- `p_user_id` (UUID, requis)

**Retourne :** Table avec colonnes (booking_id, other_user_id, last_message_content, etc.)

---

### 6. Administration

#### `create_admin_audit_log`
Crée un log d'audit pour une action admin.

**Paramètres :**
- `p_admin_id` (UUID, requis)
- `p_action_type` (TEXT, requis) - 'ban_user', 'approve_kyc', etc.
- `p_target_type` (TEXT, requis) - 'user', 'booking', 'announcement'
- `p_target_id` (UUID, requis)
- `p_details` (JSONB, optionnel)
- `p_ip_address` (TEXT, optionnel)
- `p_user_agent` (TEXT, optionnel)

**Retourne :** UUID (ID du log créé)

---

## Comment tester les fonctions RPC

### Méthode 1 : Supabase Studio (Interface Web)

1. **Accéder à Supabase Studio**
   - Ouvrir https://supabase.com/dashboard
   - Sélectionner votre projet
   - Aller dans **Database** → **Functions**

2. **Tester une fonction**
   - Cliquer sur la fonction souhaitée
   - Utiliser l'onglet **Test** ou **SQL Editor**
   - Exemple pour `search_announcements` :
   ```sql
   SELECT * FROM search_announcements(
     p_departure_country := 'FR',
     p_arrival_country := 'BJ',
     p_departure_date := '2025-12-20',
     p_min_kg := 10,
     p_sort_by := 'price',
     p_limit := 10,
     p_offset := 0
   );
   ```

### Méthode 2 : API REST (cURL)

```bash
curl -X POST 'https://tpvjycjlzxlbrtbvyfsx.supabase.co/rest/v1/rpc/search_announcements' \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "p_departure_country": "FR",
    "p_arrival_country": "BJ",
    "p_departure_date": "2025-12-20",
    "p_min_kg": 10,
    "p_sort_by": "price",
    "p_limit": 10,
    "p_offset": 0
  }'
```

### Méthode 3 : Client Supabase (JavaScript/TypeScript)

#### Côté Client (Client Component)

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

// Exemple : Recherche d'annonces
const { data, error } = await supabase.rpc('search_announcements', {
  p_departure_country: 'FR',
  p_arrival_country: 'BJ',
  p_departure_date: '2025-12-20',
  p_min_kg: 10,
  p_sort_by: 'price',
  p_limit: 10,
  p_offset: 0
})

if (error) {
  console.error('Erreur:', error)
} else {
  console.log('Résultats:', data)
}
```

#### Côté Serveur (Server Action)

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'

export async function searchAnnouncements(filters: SearchFilters) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('search_announcements', {
    p_departure_country: filters.departureCountry || null,
    p_arrival_country: filters.arrivalCountry || null,
    p_departure_date: filters.departureDate || null,
    p_min_kg: filters.minKg || null,
    p_sort_by: filters.sortBy || 'date',
    p_limit: 10,
    p_offset: 0
  })
  
  if (error) {
    return { data: null, error }
  }
  
  return { data, error: null }
}
```

### Méthode 4 : Tests unitaires (Jest/Vitest)

```typescript
import { createClient } from '@supabase/supabase-js'

describe('RPC Functions', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  it('should search announcements', async () => {
    const { data, error } = await supabase.rpc('search_announcements', {
      p_departure_country: 'FR',
      p_arrival_country: 'BJ',
      p_limit: 5
    })

    expect(error).toBeNull()
    expect(data).toBeInstanceOf(Array)
    expect(data.length).toBeLessThanOrEqual(5)
  })

  it('should count unread notifications', async () => {
    const { data, error } = await supabase.rpc('count_unread_notifications', {
      p_user_id: 'test-user-id'
    })

    expect(error).toBeNull()
    expect(typeof data).toBe('number')
    expect(data).toBeGreaterThanOrEqual(0)
  })
})
```

### Méthode 5 : Script de test Node.js

Créez un fichier `scripts/test-rpc.ts` :

```typescript
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testRPCFunctions() {
  console.log('🧪 Test des fonctions RPC...\n')

  // Test 1: search_announcements
  console.log('1. Test search_announcements')
  const { data: announcements, error: searchError } = await supabase.rpc(
    'search_announcements',
    {
      p_departure_country: 'FR',
      p_arrival_country: 'BJ',
      p_limit: 5,
    }
  )
  if (searchError) {
    console.error('❌ Erreur:', searchError)
  } else {
    console.log('✅ Résultats:', announcements?.length || 0, 'annonces')
  }

  // Test 2: count_unread_notifications
  console.log('\n2. Test count_unread_notifications')
  const { data: count, error: countError } = await supabase.rpc(
    'count_unread_notifications',
    {
      p_user_id: 'test-user-id', // Remplacez par un UUID valide
    }
  )
  if (countError) {
    console.error('❌ Erreur:', countError)
  } else {
    console.log('✅ Notifications non lues:', count)
  }

  // Test 3: create_notification
  console.log('\n3. Test create_notification')
  const { data: notificationId, error: createError } = await supabase.rpc(
    'create_notification',
    {
      p_user_id: 'test-user-id',
      p_type: 'system_alert',
      p_title: 'Test',
      p_content: 'Ceci est un test',
    }
  )
  if (createError) {
    console.error('❌ Erreur:', createError)
  } else {
    console.log('✅ Notification créée:', notificationId)
  }
}

testRPCFunctions()
  .then(() => {
    console.log('\n✅ Tests terminés')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })
```

Exécuter avec :
```bash
npx tsx scripts/test-rpc.ts
```

---

## Bonnes pratiques

### 1. Gestion des erreurs

```typescript
const { data, error } = await supabase.rpc('function_name', params)

if (error) {
  console.error('Erreur RPC:', error)
  // Gérer l'erreur selon le contexte
  return { error: error.message }
}

return { data }
```

### 2. Typage TypeScript

Créez des types pour les fonctions RPC :

```typescript
// types/rpc.ts
export interface SearchAnnouncementsParams {
  p_departure_country?: string | null
  p_arrival_country?: string | null
  p_departure_date?: string | null
  p_min_kg?: number | null
  p_sort_by?: 'date' | 'price' | 'rating'
  p_limit?: number
  p_offset?: number
}

export interface AnnouncementResult {
  id: string
  traveler_id: string
  origin_country: string
  // ... autres colonnes
  match_score: number
}
```

### 3. Validation des paramètres

```typescript
import { z } from 'zod'

const searchParamsSchema = z.object({
  p_departure_country: z.string().optional().nullable(),
  p_arrival_country: z.string().optional().nullable(),
  p_departure_date: z.string().date().optional().nullable(),
  p_min_kg: z.number().int().positive().optional().nullable(),
  p_sort_by: z.enum(['date', 'price', 'rating']).optional(),
  p_limit: z.number().int().positive().max(100).default(10),
  p_offset: z.number().int().nonnegative().default(0),
})

const validatedParams = searchParamsSchema.parse(params)
```

### 4. Cache et performance

Pour les fonctions fréquemment appelées, utilisez le cache :

```typescript
import { unstable_cache } from 'next/cache'

export const getCachedAnnouncements = unstable_cache(
  async (filters: SearchFilters) => {
    const supabase = await createClient()
    return supabase.rpc('search_announcements', filters)
  },
  ['announcements'],
  { revalidate: 60 } // Cache pendant 60 secondes
)
```

---

## Dépannage

### Erreur : "function does not exist"
- Vérifiez que la migration a été appliquée
- Vérifiez le nom exact de la fonction (sensible à la casse)
- Vérifiez que vous êtes dans le bon schéma (`public`)

### Erreur : "permission denied"
- Vérifiez les politiques RLS
- Vérifiez que l'utilisateur est authentifié si nécessaire
- Vérifiez les permissions de la fonction (`SECURITY DEFINER`)

### Erreur : "invalid input syntax"
- Vérifiez les types de paramètres (UUID, TEXT, INTEGER, etc.)
- Vérifiez que les valeurs NULL sont passées correctement
- Vérifiez le format des dates (YYYY-MM-DD)

---

## Références

- [Documentation Supabase RPC](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase Client RPC](https://supabase.com/docs/reference/javascript/rpc)

