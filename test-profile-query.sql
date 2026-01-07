-- Script de test pour diagnostiquer le timeout profiles

-- 1. Vérifier que la table profiles existe et a des données
SELECT COUNT(*) as profile_count FROM profiles;

-- 2. Lister toutes les politiques RLS sur profiles
SELECT
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Vérifier que les fonctions existent
SELECT
  routine_name,
  security_type,
  routine_definition::text
FROM information_schema.routines
WHERE routine_name IN ('can_view_profile', 'can_update_profile', 'is_admin')
ORDER BY routine_name;

-- 4. Test simple: SELECT sur profiles avec un ID fictif (sans RLS)
SET role postgres;
EXPLAIN ANALYZE SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000000';

-- 5. Vérifier si RLS est activé sur profiles
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
