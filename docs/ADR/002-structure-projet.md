# ADR-002 : Structure du Projet

**Date** : 2024-12-10
**Statut** : Accepté
**Décideurs** : Équipe Sendbox

## Contexte

Le projet Sendbox utilise Next.js (frontend + API routes) et Supabase (backend).

Besoin d'une structure claire pour :

- Séparer les responsabilités
- Faciliter l'onboarding de nouveaux devs
- Supporter la scalabilité future (monorepo possible)

## Décision

Adopter une structure **tri-partite** :

```
sendbox-project/
├── app/          # Frontend + API Routes (Next.js)
├── supabase/     # Backend (SQL, Edge Functions)
├── docs/         # Documentation (MD, ADR)
└── scripts/      # Utilitaires (deploy, seed, etc.)
```

**Principes** :

1. `app/` = Tout le code applicatif Next.js
2. `supabase/` = Tout le backend (SQL, functions)
3. `docs/` = Documentation centralisée (hors code)
4. `scripts/` = Automatisations (deploy, CI/CD)

## Conséquences

### Positives ✅

**Séparation Claire**

- Frontend/Backend séparés physiquement
- Facile de comprendre où chercher
- Onboarding rapide nouveaux devs

**Évolutivité**

- Facile de passer à un monorepo si besoin :

```
  apps/
    ├── web/       (app/)
    └── admin/     (future)
  packages/
    ├── database/  (supabase/)
    └── shared/    (types, utils)
```

**Déploiement Simplifié**

- `app/` → Vercel (auto)
- `supabase/` → Supabase CLI (`supabase db push`)
- Séparation des pipelines CI/CD

**Documentation Accessible**

- `docs/` au même niveau, pas noyé dans le code
- ADR facilement navigables
- Génération doc automatique possible

### Négatives ❌

**Duplication Types**

- Types Supabase doivent être générés et copiés
- Solution : script `supabase gen types` automatisé

**Complexité Initiale**

- Plus de dossiers que structure monolithique
- Nécessite compréhension de la séparation

## Alternatives Considérées

### Option 1 : Monolithe (tout dans app/)

**Structure**

```
app/
├── frontend/
├── backend/
└── docs/
```

**Avantages**

- Simple initialement
- Tout au même endroit

**Inconvénients**

- ❌ Backend Next.js limité (pas de cron, workers)
- ❌ Supabase migrations dans app/ (confusion)
- ❌ Scale difficile

**Raison du rejet** : Supabase est le vrai backend, pas Next.js API routes.

### Option 2 : Séparation Totale (repos séparés)

**Structure**

```
sendbox-frontend/  (repo 1)
sendbox-backend/   (repo 2)
sendbox-docs/      (repo 3)
```

**Avantages**

- Isolation maximale
- Équipes séparées possibles

**Inconvénients**

- ❌ Overhead multi-repos pour petit projet
- ❌ Versioning synchronisé complexe
- ❌ PR cross-repo difficiles

**Raison du rejet** : Overkill pour MVP, peut évoluer plus tard.

### Option 3 : Turborepo (monorepo dès le début)

**Avantages**

- Architecture moderne
- Partage code facile

**Inconvénients**

- ❌ Setup complexe initial
- ❌ Overhead pour 1 seule app
- ❌ Time-to-market plus long

**Raison du rejet** : YAGNI (You Ain't Gonna Need It) pour MVP.

## Migration Future

Si besoin de scale vers monorepo :

```bash
# Étape 1 : Créer structure Turborepo
npx create-turbo@latest

# Étape 2 : Déplacer dossiers
mv app/ apps/web/
mv supabase/ packages/database/

# Étape 3 : Configurer Turborepo
# ...
```

Coût estimé : 1-2 jours de migration.

## Références

- [Next.js Project Structure](https://nextjs.org/docs/getting-started/project-structure)
- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Turborepo Handbook](https://turbo.build/repo/docs)
