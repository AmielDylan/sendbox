# Guide de configuration Sendbox

## Configuration initiale

### 1. Variables d'environnement

Le fichier `.env.local` a été créé avec les variables Supabase suivantes :

```env
NEXT_PUBLIC_SUPABASE_URL=https://tpvjycjlzxlbrtbvyfsx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdmp5Y2psenhsYnJ0YnZ5ZnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMjM2NTYsImV4cCI6MjA4MDg5OTY1Nn0.jBkmla_pJb-NIsS2nfSCSum4OXgX9tJ85kmM4zsFL6Y
```

⚠️ **Important** : Le fichier `.env.local` est dans `.gitignore` et ne sera pas commité. Assurez-vous de le configurer sur chaque environnement (développement, staging, production).

### 2. Structure des routes

Le projet utilise les **Route Groups** de Next.js pour organiser les routes :

- `(auth)` : Routes d'authentification (login, register, etc.)
- `(dashboard)` : Routes protégées nécessitant une authentification
- `(public)` : Routes publiques accessibles à tous

### 3. Utilisation de Supabase

#### Côté client (Client Components)

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = createClient()

  // Utiliser supabase pour les opérations côté client
}
```

#### Côté serveur (Server Components, Server Actions)

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MyServerComponent() {
  const supabase = await createClient()

  // Utiliser supabase pour les opérations côté serveur
}
```

### 4. Middleware

Le fichier `middleware.ts` gère automatiquement le rafraîchissement des sessions Supabase. Il intercepte toutes les requêtes (sauf les fichiers statiques) et rafraîchit la session si nécessaire.

### 5. Styles et thème

La couleur principale `#0d5554` est configurée dans `app/globals.css` et peut être utilisée via :

- Variable CSS : `var(--primary)`
- Classe Tailwind : `bg-[#0d5554]` ou via les variables CSS personnalisées

### 6. Formatage du code

Le projet utilise Prettier pour le formatage automatique :

```bash
# Formater tout le code
npm run format

# Vérifier le formatage sans modifier
npm run format:check
```

## Commandes utiles

```bash
# Démarrer le serveur de développement
npm run dev

# Compiler pour la production
npm run build

# Lancer le serveur de production
npm run start

# Vérifier le code avec ESLint
npm run lint

# Formater le code avec Prettier
npm run format
```

## Prochaines étapes

1. Configurer la base de données Supabase (tables, RLS policies)
2. Implémenter l'authentification (login, register)
3. Créer les composants UI réutilisables dans `components/ui/`
4. Développer les fonctionnalités métier dans `components/features/`
5. Créer les API routes dans `app/api/` si nécessaire
