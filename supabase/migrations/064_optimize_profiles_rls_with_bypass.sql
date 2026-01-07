-- Optimisation RLS profiles: Court-circuiter is_admin() pour utilisateurs normaux
-- Problème: PostgreSQL évalue is_admin() même si id = auth.uid() match
-- Solution: Fonction combinée qui vérifie d'abord l'ownership puis admin

-- Créer une fonction optimisée qui vérifie ownership OU admin
CREATE OR REPLACE FUNCTION can_view_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Court-circuit: Si c'est son propre profil, retourner immédiatement TRUE
  IF profile_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- Sinon, vérifier si l'utilisateur est admin
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Remplacer les deux politiques SELECT par une seule politique optimisée
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view accessible profiles"
ON profiles FOR SELECT
TO authenticated
USING (can_view_profile(id));

-- Faire pareil pour UPDATE
CREATE OR REPLACE FUNCTION can_update_profile(profile_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Court-circuit: Si c'est son propre profil, retourner immédiatement TRUE
  IF profile_id = auth.uid() THEN
    RETURN TRUE;
  END IF;

  -- Sinon, vérifier si l'utilisateur est admin
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Users can update accessible profiles"
ON profiles FOR UPDATE
TO authenticated
USING (can_update_profile(id))
WITH CHECK (can_update_profile(id));

-- Commentaires
COMMENT ON FUNCTION can_view_profile(UUID) IS
  'Vérifie si l''utilisateur peut voir un profil. Court-circuite avec check ownership avant check admin pour éviter récursion.';

COMMENT ON FUNCTION can_update_profile(UUID) IS
  'Vérifie si l''utilisateur peut modifier un profil. Court-circuite avec check ownership avant check admin pour éviter récursion.';

COMMENT ON POLICY "Users can view accessible profiles" ON profiles IS
  'Utilisateurs peuvent voir leur propre profil OU tous les profils si admin. Optimisé avec court-circuit ownership.';

COMMENT ON POLICY "Users can update accessible profiles" ON profiles IS
  'Utilisateurs peuvent modifier leur propre profil OU tous les profils si admin. Optimisé avec court-circuit ownership.';
