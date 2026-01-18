# Exemple de migration: Transformer une page existante

Ce guide montre **concrètement** comment migrer une page utilisant l'ancien pattern vers le nouveau pattern optimisé.

---

## 📝 Exemple: Page Annonces utilisateur

### AVANT (Pattern problématique)

```typescript
// ❌ app/(dashboard)/dashboard/annonces/page.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from "@/lib/shared/db/client"
import { useAuth } from '@/hooks/use-auth'

export default function MyAnnouncementsPage() {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')
  const { user } = useAuth()

  // ❌ PROBLÈME 1: Double fetch de session dans queryFn
  // ❌ PROBLÈME 2: Timeout manuel avec Promise.race
  // ❌ PROBLÈME 3: Retry trop faible
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['user-announcements', activeTab],
    queryFn: async () => {
      const supabase = createClient()

      // ❌ PROBLÈME 1: Double fetch de session
      const { data: { session } } = await supabase.auth.getSession()
      let effectiveUserId = user?.id || session?.user?.id

      if (!effectiveUserId) {
        // ❌ Deuxième requête auth!
        const { data: refreshed } = await supabase.auth.refreshSession()
        effectiveUserId = refreshed.session?.user?.id
      }

      if (!effectiveUserId) {
        return []
      }

      let query = supabase
        .from('announcements')
        .select('*')
        .eq('user_id', effectiveUserId)

      if (activeTab === 'active') {
        query = query.eq('status', 'active')
      } else {
        query = query.in('status', ['inactive', 'expired'])
      }

      // ❌ PROBLÈME 2: Timeout manuel
      const { data: announcements, error } = await Promise.race([
        query.order('created_at', { ascending: false }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 12000)
        ),
      ]) as any

      if (error) {
        console.error('Get announcements error:', error)
        throw error
      }

      return announcements
    },
    // ❌ PROBLÈME 3: Retry trop faible
    retry: 2,
    // ❌ PROBLÈME 4: Pas de configuration de cache
  })

  const announcements = data || []

  if (isLoading) {
    return <div>Chargement...</div>
  }

  if (isError) {
    return <div>Erreur de chargement</div>
  }

  return (
    <div>
      {announcements.map((announcement) => (
        <div key={announcement.id}>{announcement.title}</div>
      ))}
    </div>
  )
}
```

---

### APRÈS (Pattern optimisé)

```typescript
// ✅ app/(dashboard)/dashboard/annonces/page.tsx
'use client'

import { useState } from 'react'
import { useAuthenticatedQuery, queryWithAbort } from '@/hooks/use-authenticated-query'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/shared/query/config'
import { createClient } from "@/lib/shared/db/client"
import { IconLoader2, IconAlertCircle } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

interface Announcement {
  id: string
  title: string
  status: string
  created_at: string
  // ... autres champs
}

export default function MyAnnouncementsPageOptimized() {
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active')

  // ✅ SOLUTION: useAuthenticatedQuery gère tout automatiquement
  const { data, isLoading, isError, error, refetch } = useAuthenticatedQuery<Announcement[]>(
    // ✅ Clé standardisée pour invalidation précise
    QUERY_KEYS.userAnnouncements('current', activeTab),

    // ✅ queryFn reçoit userId directement (pas de getSession!)
    // ✅ signal pour timeout propre
    async (userId, signal) => {
      const supabase = createClient()

      // Construire la query
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('user_id', userId)  // ✅ userId déjà disponible!

      if (activeTab === 'active') {
        query = query.eq('status', 'active')
      } else {
        query = query.in('status', ['inactive', 'expired'])
      }

      // ✅ Timeout géré par AbortSignal (pas de Promise.race!)
      return queryWithAbort<Announcement[]>(
        query.order('created_at', { ascending: false }),
        signal
      )
    },

    // ✅ Configuration optimisée
    {
      // Timeout de 5 secondes (au lieu de 12)
      timeout: 5000,

      // Configuration adaptée pour les listes
      staleTime: QUERY_CONFIG.LISTS.staleTime,  // 30 secondes
      gcTime: QUERY_CONFIG.LISTS.gcTime,        // 15 minutes
      refetchOnWindowFocus: false,

      // Retry automatique avec backoff exponentiel (du config global)
      // 3 tentatives: 1s, 2s, 4s
    }
  )

  const announcements = data || []

  // ✅ UI de chargement améliorée
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">
            Chargement de vos annonces...
          </p>
        </div>
      </div>
    )
  }

  // ✅ UI d'erreur améliorée avec retry
  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4 max-w-md">
          <IconAlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <div>
            <h3 className="font-semibold text-lg mb-2">
              Erreur de chargement
            </h3>
            <p className="text-sm text-muted-foreground">
              {error?.message || 'Impossible de charger vos annonces.'}
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-4">
        {/* Tabs pour activer/inactif */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('active')}
            className={activeTab === 'active' ? 'active' : ''}
          >
            Actives
          </button>
          <button
            onClick={() => setActiveTab('inactive')}
            className={activeTab === 'inactive' ? 'active' : ''}
          >
            Inactives
          </button>
        </div>

        {/* Liste des annonces */}
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Aucune annonce</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id}>
              {announcement.title}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
```

---

## 📊 Comparaison des changements

| Aspect | Avant | Après |
|--------|-------|-------|
| **Lignes de code** | ~80 lignes | ~90 lignes |
| **Requêtes auth** | 2-3 par chargement | 0 |
| **Timeout** | 12s × 2 = 24s | 5s × 3 = 15s max |
| **Temps de chargement** | 2-24s | 1-5s |
| **Gestion erreur** | Basique | Complète avec retry |
| **Cache** | Non configuré | 30s stale, 15min gc |
| **Invalidation** | Manuelle | Automatique via QUERY_KEYS |

---

## 🔄 Pattern de migration en 5 étapes

### Étape 1: Imports

```typescript
// Ajouter ces imports
import { useAuthenticatedQuery, queryWithAbort } from '@/hooks/use-authenticated-query'
import { QUERY_KEYS, QUERY_CONFIG } from '@/lib/shared/query/config'

// Supprimer si présent
// import { useAuth } from '@/hooks/use-auth'  // Utiliser OptimizedAuthProvider à la place
```

### Étape 2: Remplacer useQuery par useAuthenticatedQuery

```typescript
// Avant
const { data } = useQuery({
  queryKey: ['some-key'],
  queryFn: async () => { /* ... */ }
})

// Après
const { data } = useAuthenticatedQuery(
  QUERY_KEYS.appropriateKey(...),
  async (userId, signal) => { /* ... */ },
  { timeout: 5000, ...QUERY_CONFIG.LISTS }
)
```

### Étape 3: Supprimer le code d'auth du queryFn

```typescript
// ❌ Supprimer ces lignes
const { data: { session } } = await supabase.auth.getSession()
let effectiveUserId = user?.id || session?.user?.id
if (!effectiveUserId) {
  const { data: refreshed } = await supabase.auth.refreshSession()
  effectiveUserId = refreshed.session?.user?.id
}

// ✅ userId est déjà fourni par le hook
async (userId, signal) => {
  // Utiliser directement userId
}
```

### Étape 4: Remplacer Promise.race par queryWithAbort

```typescript
// ❌ Avant
const { data, error } = await Promise.race([
  query,
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), 12000)
  ),
]) as any

// ✅ Après
return queryWithAbort<YourType[]>(query, signal)
```

### Étape 5: Ajouter la configuration optimisée

```typescript
// ✅ Ajouter en troisième paramètre
{
  timeout: 5000,
  staleTime: QUERY_CONFIG.LISTS.staleTime,
  gcTime: QUERY_CONFIG.LISTS.gcTime,
  refetchOnWindowFocus: false,
}
```

---

## 🎯 Checklist de migration par page

- [ ] Remplacer `useQuery` par `useAuthenticatedQuery`
- [ ] Utiliser `QUERY_KEYS` pour la clé de requête
- [ ] Supprimer le code `getSession()` / `refreshSession()`
- [ ] Remplacer `Promise.race` timeout par `queryWithAbort`
- [ ] Ajouter `timeout` et config adaptée (`QUERY_CONFIG.LISTS` ou autre)
- [ ] Améliorer l'UI de chargement avec IconLoader2
- [ ] Améliorer l'UI d'erreur avec bouton Réessayer
- [ ] Tester le chargement (< 5 secondes)
- [ ] Tester avec connexion lente
- [ ] Tester le changement d'onglets (pas de perte de données)

---

## 🧪 Tests de validation

### Test 1: Temps de chargement

```bash
# Avant migration
Temps: 8-24 secondes

# Après migration
Temps: 1-5 secondes
```

### Test 2: Navigation entre pages

```bash
# Avant migration
1. Aller sur page Annonces → Chargement
2. Aller sur page Colis → Chargement
3. Retour page Annonces → RECHARGEMENT (perte cache)

# Après migration
1. Aller sur page Annonces → Chargement
2. Aller sur page Colis → Chargement
3. Retour page Annonces → INSTANTANÉ (cache préservé)
```

### Test 3: Multi-onglets

```bash
# Avant migration
1. Ouvrir deux onglets
2. Se déconnecter dans l'onglet 1
3. Onglet 2 → Pas de mise à jour (désynchronisé)

# Après migration
1. Ouvrir deux onglets
2. Se déconnecter dans l'onglet 1
3. Onglet 2 → Mise à jour automatique (BroadcastChannel)
```

---

## 📝 Autres exemples de migration

### Exemple: Page de détails (requête publique)

```typescript
// Pour les pages qui ne nécessitent PAS d'auth
import { usePublicQuery } from '@/hooks/use-authenticated-query'

const { data } = usePublicQuery(
  QUERY_KEYS.announcementDetail(id),
  async (signal) => {
    const supabase = createClient()
    return queryWithAbort(
      supabase.from('announcements').select('*').eq('id', id).single(),
      signal
    )
  },
  {
    timeout: 8000,
    ...QUERY_CONFIG.STATIC,  // Cache plus long pour les détails
  }
)
```

### Exemple: Page avec mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invalidateAfterMutation, QUERY_KEYS } from '@/lib/shared/query/config'

function MyComponent() {
  const queryClient = useQueryClient()

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementData) => {
      // ... création
    },
    onSuccess: () => {
      // ✅ Invalidation ciblée après mutation
      invalidateAfterMutation(queryClient, 'announcement', user?.id)
    },
  })
}
```

---

## 💡 Tips et astuces

### Tip 1: Choisir la bonne config

```typescript
// Données utilisateur (profil, préférences)
...QUERY_CONFIG.USER_DATA

// Listes dynamiques (annonces, réservations)
...QUERY_CONFIG.LISTS

// Messages temps réel
...QUERY_CONFIG.REALTIME

// Données statiques (catégories, pays)
...QUERY_CONFIG.STATIC
```

### Tip 2: Debugging

```typescript
// Ajouter des logs pour debugging
const { data, isLoading } = useAuthenticatedQuery(
  QUERY_KEYS.userBookings(userId),
  async (userId, signal) => {
    console.log('[Query] Fetching bookings for user:', userId)
    const result = await queryWithAbort(query, signal)
    console.log('[Query] Bookings fetched:', result.length)
    return result
  },
  { timeout: 5000 }
)
```

### Tip 3: Gestion d'erreur personnalisée

```typescript
const { error } = useAuthenticatedQuery(...)

// Différencier les types d'erreurs
if (error?.name === 'QueryTimeoutError') {
  return <div>Le serveur met trop de temps à répondre</div>
} else if (error?.name === 'AuthenticationRequiredError') {
  return <div>Vous devez être connecté</div>
} else {
  return <div>Erreur: {error?.message}</div>
}
```

---

## ✅ Migration réussie quand...

- ✅ Page charge en < 5 secondes
- ✅ Pas de double-fetch visible dans Network tab
- ✅ Cache persiste entre les navigations
- ✅ Erreurs affichent un message clair + bouton Retry
- ✅ Multi-onglets synchronisés
- ✅ Pas d'erreur dans la console
- ✅ React Query DevTools montre le cache correctement

---

**Prochaine étape:** Appliquer ce pattern à toutes vos pages!
