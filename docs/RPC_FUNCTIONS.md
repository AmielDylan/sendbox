# Fonctions RPC Supabase

Documentation des fonctions RPC (Remote Procedure Call) disponibles dans Supabase pour Sendbox.

## 📋 Table des matières

- [Fonctions de recherche d'annonces](#fonctions-de-recherche-dannonces)
- [Fonctions de notifications](#fonctions-de-notifications)
- [Tests](#tests)

---

## 🔍 Fonctions de recherche d'annonces

### `search_announcements`

Recherche d'annonces avec filtres et tri. Retourne les annonces publiées avec score de matching.

#### Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `p_departure_country` | TEXT | NULL | Pays de départ (ex: 'FR', 'BJ') |
| `p_arrival_country` | TEXT | NULL | Pays d'arrivée (ex: 'FR', 'BJ') |
| `p_departure_date` | DATE | NULL | Date de départ souhaitée |
| `p_min_kg` | INTEGER | NULL | Poids minimum requis (en kg) |
| `p_sort_by` | TEXT | 'date' | Tri: 'date', 'price', ou 'rating' |
| `p_limit` | INTEGER | 10 | Nombre maximum de résultats |
| `p_offset` | INTEGER | 0 | Décalage pour pagination |

#### Retour

Table avec les colonnes suivantes :

- `id` (UUID) - ID de l'annonce
- `traveler_id` (UUID) - ID du voyageur
- `origin_country` (TEXT) - Pays d'origine
- `origin_city` (TEXT) - Ville d'origine
- `destination_country` (TEXT) - Pays de destination
- `destination_city` (TEXT) - Ville de destination
- `departure_date` (TIMESTAMPTZ) - Date de départ
- `max_weight_kg` (NUMERIC) - Poids maximum disponible
- `price_per_kg` (NUMERIC) - Prix par kilogramme
- `description` (TEXT) - Description de l'annonce
- `status` (TEXT) - Statut ('published', 'partially_booked', 'active', 'draft')
- `created_at` (TIMESTAMPTZ) - Date de création
- `updated_at` (TIMESTAMPTZ) - Date de mise à jour
- `traveler_first_name` (TEXT) - Prénom du voyageur
- `traveler_last_name` (TEXT) - Nom du voyageur
- `traveler_avatar_url` (TEXT) - URL de l'avatar du voyageur
- `traveler_rating` (NUMERIC) - Note moyenne du voyageur
- `traveler_services_count` (BIGINT) - Nombre de services complétés
- `match_score` (NUMERIC) - Score de correspondance (0-50)

#### Calcul du match score

Le score de correspondance est calculé comme suit :

- **Pays de départ correspondant** : +10 points
- **Pays d'arrivée correspondant** : +10 points
- **Date de départ** :
  - Date exacte : +20 points
  - ±1 jour : +15 points
  - ±2 jours : +10 points
  - ±3 jours : +5 points
- **Poids minimum satisfait** : +10 points

#### Exemple d'utilisation

```typescript
const { data, error } = await supabase.rpc('search_announcements', {
  p_departure_country: 'FR',
  p_arrival_country: 'BJ',
  p_departure_date: '2024-12-20',
  p_min_kg: 5,
  p_sort_by: 'price',
  p_limit: 10,
  p_offset: 0
})
```

---

### `count_search_announcements`

Compte le nombre total d'annonces correspondant aux critères de recherche.

#### Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `p_departure_country` | TEXT | NULL | Pays de départ |
| `p_arrival_country` | TEXT | NULL | Pays d'arrivée |
| `p_departure_date` | DATE | NULL | Date de départ souhaitée |
| `p_min_kg` | INTEGER | NULL | Poids minimum requis |

#### Retour

`INTEGER` - Nombre total d'annonces correspondantes

#### Exemple d'utilisation

```typescript
const { data, error } = await supabase.rpc('count_search_announcements', {
  p_departure_country: 'FR',
  p_arrival_country: 'BJ'
})
```

---

## 🔔 Fonctions de notifications

### `count_unread_notifications`

Compte le nombre de notifications non lues pour un utilisateur.

#### Paramètres

| Paramètre | Type | Description |
|-----------|------|-------------|
| `p_user_id` | UUID | ID de l'utilisateur |

#### Retour

`INTEGER` - Nombre de notifications non lues

#### Exemple d'utilisation

```typescript
const { data, error } = await supabase.rpc('count_unread_notifications', {
  p_user_id: 'user-uuid-here'
})
```

---

## 🧪 Tests

### Script de test

Un script de test est disponible dans `scripts/test-rpc-simple.ts` pour valider toutes les fonctions RPC.

#### Exécution

```bash
npx tsx scripts/test-rpc-simple.ts
```

#### Résultats attendus

Tous les tests doivent passer avec succès :

- ✅ `count_unread_notifications` - Fonctionne
- ✅ `search_announcements` - Fonctionne
- ✅ `search_announcements` (avec filtres) - Fonctionne
- ✅ `count_search_announcements` - Fonctionne

---

## 📝 Notes importantes

### Statuts d'annonces valides

Les statuts suivants sont acceptés dans les fonctions de recherche :

- `'published'` - Annonce publiée
- `'partially_booked'` - Partiellement réservée
- `'active'` - Active
- `'draft'` - Brouillon

### Colonnes de la table profiles

Les fonctions utilisent les colonnes suivantes de la table `profiles` :

- `id` (UUID) - Identifiant unique
- `firstname` (TEXT) - Prénom
- `lastname` (TEXT) - Nom
- `avatar_url` (TEXT) - URL de l'avatar

### Performance

- Les fonctions utilisent des index sur les colonnes fréquemment filtrées
- Le calcul du match score est optimisé pour les performances
- La pagination est recommandée pour les grandes listes de résultats

---

## 🔧 Maintenance

### Migrations

Les fonctions RPC sont créées et mises à jour via les migrations Supabase :

- `004_search_announcements_function.sql` - Création initiale
- `017_fix_search_announcements.sql` - Première correction
- `020_complete_fix_announcements_and_rpc.sql` - Correction complète
- `025_remove_extract_from_rpc.sql` - Optimisation EXTRACT
- `026_fix_search_announcements_types.sql` - Correction types de retour

### Dépannage

Si les fonctions ne fonctionnent pas :

1. Vérifier que toutes les migrations sont appliquées : `supabase db push --linked`
2. Vérifier que les tables existent : `announcements`, `profiles`, `bookings`, `ratings`
3. Exécuter les tests : `npx tsx scripts/test-rpc-simple.ts`
4. Vérifier les logs Supabase pour les erreurs SQL

---

**Dernière mise à jour** : 2024-12-10
