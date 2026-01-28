# Scripts

Ce répertoire contient tous les scripts utilitaires pour le projet Sendbox.

## Structure

### `/db` - Scripts de base de données

Scripts pour gérer et manipuler la base de données Supabase.

### `/dev` - Scripts de développement

Scripts pour faciliter le développement local.

- `dev-with-stripe.sh` - Configure l'environnement pour tester avec Stripe localement

### `/setup` - Scripts d'installation

Scripts pour la configuration initiale du projet.

### `/test` - Scripts de test et diagnostic

Scripts pour tester et diagnostiquer le système.

- `check-all-announcements.ts` - Vérifie toutes les annonces
- `check-announcements-schema.ts` - Vérifie le schéma des annonces
- `check-trigger-functions.ts` - Vérifie les fonctions triggers
- `debug-search.ts` - Debug de la fonction de recherche
- `diagnose-available-kg.ts` - Diagnostic du champ available_kg
- `test-booking-creation.ts` - Test de création de réservation
- `test-search.ts` - Test de la recherche d'annonces

### `/maintenance` - Scripts de maintenance

Scripts pour la maintenance et les opérations ponctuelles.

- `delete-and-regenerate-all-contracts.ts` - Régénère tous les contrats
- `regenerate-contract.ts` - Régénère un contrat spécifique

### `/utils` - Utilitaires divers

Scripts utilitaires généraux.

- `cleanup_duplicate_columns.sh` - Nettoie les colonnes dupliquées
- `clear-all-caches.sh` - Vide tous les caches
- `reload-postgrest-schema.ts` - Recharge le schéma PostgREST

### Scripts à la racine

- `create-resend-templates.ts` - Créer/mettre à jour/supprimer les templates d'emails Resend (API)
- `clean-database.ts` - Nettoyer toutes les données de la base sauf les utilisateurs
- `clean-database.sql` - Script SQL pour nettoyer la base de données directement

## Utilisation

Pour exécuter un script TypeScript:

```bash
npx tsx scripts/path/to/script.ts
```

Pour exécuter un script shell:

```bash
bash scripts/path/to/script.sh
```

### Nettoyage de la base de données

⚠️ **ATTENTION**: Ces scripts suppriment définitivement les données. Faites toujours un backup avant.

```bash
# Voir ce qui serait supprimé (simulation)
npx tsx scripts/clean-database.ts --dry-run

# Nettoyer avec confirmation interactive
npx tsx scripts/clean-database.ts

# Nettoyer sans confirmation
npx tsx scripts/clean-database.ts --confirm

# Nettoyer avec les fichiers du storage
npx tsx scripts/clean-database.ts --confirm --include-storage
```

**Tables supprimées**: announcements, bookings, transactions, ratings, messages, notifications
**Tables conservées**: profiles (utilisateurs), auth.users

**Alternative SQL**: Pour exécuter directement dans Supabase SQL Editor, utilisez `scripts/clean-database.sql`

### Templates Resend

Exemples d'utilisation du script Resend:

```bash
# Met à jour les templates existants ou les crée si nécessaire
npx tsx scripts/create-resend-templates.ts --action=upsert

# Met à jour uniquement un template précis
npx tsx scripts/create-resend-templates.ts --action=update --only=booking_request

# Supprime un template (confirmation explicite)
npx tsx scripts/create-resend-templates.ts --action=delete --only=booking_request --confirm-delete

# Supprime tous les templates puis recrée ceux du script
npx tsx scripts/create-resend-templates.ts --action=reset --confirm-delete
```

## Contribution

Lorsque vous ajoutez un nouveau script, placez-le dans le répertoire approprié et mettez à jour ce README.
