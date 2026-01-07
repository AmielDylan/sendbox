-- Diagnostic des politiques RLS sur profiles pour comprendre le timeout

-- Lister toutes les politiques sur profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Vérifier les fonctions can_view_profile et can_update_profile
SELECT
  routine_name,
  routine_type,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name IN ('can_view_profile', 'can_update_profile', 'is_admin')
ORDER BY routine_name;
