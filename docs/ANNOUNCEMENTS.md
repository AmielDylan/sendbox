# Documentation Annonces - Sendbox

Système de création et gestion des annonces de trajets.

## 📋 Vue d'ensemble

Les voyageurs peuvent publier leurs trajets avec espace disponible dans leurs valises pour transporter des colis.

## 🔐 Sécurité

### Vérifications avant création

- **KYC approuvé** : L'utilisateur doit avoir un KYC `approved`
- **Limite d'annonces** : Maximum 10 annonces actives par utilisateur
- **Validation Zod** : Côté serveur dans Server Actions
- **RLS Policies** : Protection des données via Supabase RLS

## 📁 Structure

```
lib/
├── validations/
│   └── announcement.ts      # Schémas Zod pour annonces
├── actions/
│   └── announcement.ts     # Server Actions (create, etc.)
└── utils/
    └── cities.ts           # Autocomplete villes

app/
└── (dashboard)/
    └── annonces/
        └── new/
            └── page.tsx    # Page création annonce (multi-step)
```

## 🚀 Fonctionnalités

### Formulaire Multi-Step (3 étapes)

1. **Étape 1 : Trajet**
   - Pays de départ (FR/BJ)
   - Ville de départ (autocomplete)
   - Date de départ (date picker)
   - Pays d'arrivée (FR/BJ)
   - Ville d'arrivée (autocomplete)
   - Date d'arrivée (date picker)

2. **Étape 2 : Capacité**
   - Poids disponible (slider 1-30 kg)
   - Prix par kilo (input 5-100 €)
   - Description optionnelle (textarea max 500 char)

3. **Étape 3 : Preview & Publication**
   - Récapitulatif complet
   - Boutons Retour / Publier

### Autocomplete Villes

- **France** : API Adresse Data Gouv (`https://api-adresse.data.gouv.fr`)
- **Bénin** : Liste prédéfinie (15 villes principales)
- Debounce 300ms pour optimiser les appels API
- Suggestions affichées en dropdown

## 📝 Validation

### Schéma Zod

```typescript
createAnnouncementSchema = z
  .object({
    departure_country: z.enum(['FR', 'BJ']),
    departure_city: z.string().min(2).max(100),
    departure_date: z.date().min(new Date()),
    arrival_country: z.enum(['FR', 'BJ']),
    arrival_city: z.string().min(2).max(100),
    arrival_date: z.date(),
    available_kg: z.number().min(1).max(30),
    price_per_kg: z.number().min(5).max(100),
    description: z.string().max(500).optional(),
  })
  .refine(data => data.arrival_date > data.departure_date)
  .refine(data => data.departure_country !== data.arrival_country)
```

### Règles de validation

- Date d'arrivée > Date de départ
- Pays départ ≠ Pays arrivée
- Poids : 1-30 kg
- Prix : 5-100 €/kg
- Description : max 500 caractères

## 🛠️ API

### Server Actions

```typescript
// Créer une annonce
await createAnnouncement({
  departure_country: 'FR',
  departure_city: 'Paris',
  departure_date: Date,
  arrival_country: 'BJ',
  arrival_city: 'Cotonou',
  arrival_date: Date,
  available_kg: 10,
  price_per_kg: 15,
  description?: string
})

// Récupérer le nombre d'annonces actives
await getActiveAnnouncementsCount()
```

## 🔄 Workflow

```
Utilisateur accède à /dashboard/annonces/new
    ↓
Vérification KYC (côté serveur)
    ↓
Formulaire multi-step
    ↓
Étape 1 : Trajet (validation)
    ↓
Étape 2 : Capacité (validation)
    ↓
Étape 3 : Preview
    ↓
Soumission → Server Action
    ↓
Vérification KYC + limite annonces
    ↓
Création annonce (status: 'active')
    ↓
Redirection vers /dashboard/annonces/[id]
    ↓
Toast "Annonce créée avec succès"
```

## 📊 Schéma Base de Données

Table `announcements` :

- `traveler_id` : UUID (référence profiles)
- `origin_country` : TEXT (FR/BJ)
- `origin_city` : TEXT
- `destination_country` : TEXT (FR/BJ)
- `destination_city` : TEXT
- `departure_date` : TIMESTAMPTZ
- `max_weight_kg` : NUMERIC
- `price_per_kg` : NUMERIC
- `description` : TEXT (nullable)
- `status` : ENUM ('draft', 'active', 'completed', 'cancelled')

## 🌍 Autocomplete Villes

### France

- **API** : `https://api-adresse.data.gouv.fr/search/`
- **Type** : `municipality`
- **Limit** : 10 résultats
- **Debounce** : 300ms

### Bénin

- **Liste prédéfinie** : 15 villes principales
- **Recherche** : Filtrage local (case-insensitive)
- **Villes** : Cotonou, Porto-Novo, Parakou, Djougou, Bohicon, Abomey, Natitingou, Lokossa, Ouidah, Kandi, Savalou, Sakété, Comè, Kérou, Malanville

## ⚠️ Notes Importantes

1. **KYC requis** : Redirection vers `/dashboard/reglages/kyc` si non approuvé
2. **Limite annonces** : 10 annonces actives max (draft + active)
3. **Status initial** : Les annonces sont créées avec `status: 'active'`
4. **Dates** : Date d'arrivée minimum = date départ + 1 jour
5. **Pays différents** : Validation empêche départ/arrivée même pays

## 🔗 Ressources

- [API Adresse Data Gouv](https://adresse.data.gouv.fr/api-doc/adresse)
- [React Hook Form](https://react-hook-form.com/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)








