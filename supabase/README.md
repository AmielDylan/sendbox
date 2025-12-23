# Backend Supabase - Sendbox

Architecture backend basée sur PostgreSQL avec Supabase.

## 📁 Structure

- `migrations/` : Migrations SQL versionnées (appliquées dans l'ordre)
- `functions/` : Edge Functions Supabase (webhooks, cron jobs)
- `seed.sql` : Données de test pour développement local
- `config.toml` : Configuration Supabase CLI pour dev local

## 🚀 Commandes Supabase CLI

### Installation CLI

```bash
npm install -g supabase
```

### Développement Local

```bash
# Démarrer Supabase localement (Docker requis)
supabase start

# Arrêter
supabase stop

# Reset (supprime toutes les données)
supabase db reset
```

### Migrations

```bash
# Créer nouvelle migration
supabase migration new nom_de_la_migration

# Appliquer migrations en local
supabase db push

# Appliquer migrations en production
supabase db push --linked
```

### Types TypeScript

```bash
# Générer types depuis DB locale
supabase gen types typescript --local > ../types/supabase.ts

# Générer types depuis DB production
supabase gen types typescript --linked > ../types/supabase.ts
```

### Lien avec Projet Cloud

```bash
# Lier projet local avec Supabase Cloud
supabase link --project-ref tpvjycjlzxlbrtbvyfsx
```

## 📊 Accès Interfaces

Après `supabase start` :

- **Supabase Studio** : http://localhost:54323
- **API Gateway** : http://localhost:54321
- **PostgreSQL** : postgresql://postgres:postgres@localhost:54322/postgres

## 🔐 Sécurité

- Toutes les tables ont Row Level Security (RLS) activé
- Policies définies dans les migrations
- Service Role Key : jamais commit dans Git

## 📚 Documentation

Voir `docs/sendbox_schema.sql` pour le schéma complet annoté.








