# Instructions : Application des migrations Supabase

## Étape 1 : Migration 027 - Fix get_user_conversations

### Via l'interface Supabase (Recommandé)

1. **Accéder au SQL Editor**
   - Aller sur https://supabase.com/dashboard/project/tpvjycjlzxlbrtbvyfsx
   - Cliquer sur "SQL Editor" dans le menu latéral

2. **Créer une nouvelle requête**
   - Cliquer sur "New query"

3. **Copier le contenu de la migration 027**
   - Ouvrir le fichier : `supabase/migrations/027_fix_get_user_conversations_ambiguous.sql`
   - Copier tout le contenu (60 lignes)

4. **Exécuter la migration**
   - Coller le contenu dans l'éditeur SQL
   - Cliquer sur "Run" ou appuyer sur Cmd/Ctrl + Enter
   - Vérifier qu'il n'y a pas d'erreurs

5. **Vérification**
   - La fonction `get_user_conversations` devrait être mise à jour
   - Pas d'erreur "column reference booking_id is ambiguous"

---

## Étape 2 : Migration 028 - Fix RLS infinite recursion

### Via l'interface Supabase (Recommandé)

1. **Nouvelle requête SQL**
   - Dans le SQL Editor, cliquer sur "New query"

2. **Copier le contenu de la migration 028**
   - Ouvrir le fichier : `supabase/migrations/028_fix_profiles_rls_infinite_recursion.sql`
   - Copier tout le contenu (88 lignes)

3. **Exécuter la migration**
   - Coller le contenu dans l'éditeur SQL
   - Cliquer sur "Run"
   - **IMPORTANT** : Cette migration supprime et recrée plusieurs politiques RLS

4. **Vérification**
   - La fonction `is_admin(uuid)` devrait être créée
   - Les politiques RLS sur `profiles`, `bookings`, `transactions`, `admin_audit_logs` devraient être recréées
   - Plus d'erreur "infinite recursion detected in policy"

---

## Vérification post-migrations

### Test rapide depuis le SQL Editor

```sql
-- Test 1 : Vérifier que la fonction is_admin existe
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'is_admin';

-- Test 2 : Vérifier la fonction get_user_conversations
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_user_conversations';

-- Test 3 : Lister les politiques RLS sur profiles
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'profiles';
```

**Résultats attendus** :
- `is_admin` : 1 fonction trouvée
- `get_user_conversations` : 1 fonction trouvée (mise à jour)
- Politiques profiles : Au moins 4 politiques (Admins can view, Admins can update, Users can view own, Users can update own)

---

## Alternative : Via CLI Supabase (si configuré)

```bash
# Si vous avez configuré Supabase CLI et lié le projet
cd /Users/amieladjovi/Documents/Projets/Developpement/Projets/sendbox

# Appliquer toutes les migrations en attente
supabase db push --linked

# Ou appliquer manuellement chaque migration
psql $DATABASE_URL -f supabase/migrations/027_fix_get_user_conversations_ambiguous.sql
psql $DATABASE_URL -f supabase/migrations/028_fix_profiles_rls_infinite_recursion.sql
```

---

## En cas d'erreur

### Erreur : "function already exists"
- C'est normal, la migration utilise `CREATE OR REPLACE`
- La fonction sera mise à jour

### Erreur : "policy already exists"
- Les migrations utilisent `DROP POLICY IF EXISTS` avant de recréer
- Si l'erreur persiste, supprimer manuellement la politique en question

### Erreur : "permission denied"
- Vérifier que vous êtes connecté avec un compte ayant les droits admin
- Utiliser le service_role key si nécessaire

---

## Prochaine étape

Une fois les migrations appliquées, passer à la **Phase 2 : Configuration environnement**





