-- Fix Profile query timeout: Ajouter politique manquante pour les utilisateurs normaux
-- Problème: Seule la politique admin existe, causant timeout pour utilisateurs normaux
-- Solution: Ajouter politique permettant aux utilisateurs de voir leur propre profil

-- Vérifier d'abord les politiques existantes
DO $$
BEGIN
  RAISE NOTICE 'Politiques profiles existantes:';
END $$;

-- Créer la politique permettant aux utilisateurs de voir leur propre profil
-- Cette politique doit être vérifiée AVANT la politique admin pour éviter récursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- S'assurer que la politique admin existe aussi (pour cohérence)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin());

-- Ajouter aussi politique UPDATE pour son propre profil
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- S'assurer que la politique admin UPDATE existe
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Commentaires pour documentation
COMMENT ON POLICY "Users can view their own profile" ON profiles IS
  'Permet aux utilisateurs de voir leur propre profil. Vérifié en premier pour éviter récursion avec is_admin().';

COMMENT ON POLICY "Admins can view all profiles" ON profiles IS
  'Permet aux admins de voir tous les profils. Vérifié après la politique de profil propre.';

COMMENT ON POLICY "Users can update their own profile" ON profiles IS
  'Permet aux utilisateurs de modifier leur propre profil.';

COMMENT ON POLICY "Admins can update profiles" ON profiles IS
  'Permet aux admins de modifier tous les profils.';
