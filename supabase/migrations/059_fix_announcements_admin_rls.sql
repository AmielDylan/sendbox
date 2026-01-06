-- Fix récursion infinie RLS pour les politiques admin sur announcements
-- Problème: Les politiques admin font SELECT FROM profiles, ce qui peut causer une récursion
-- Solution: Fonction SECURITY DEFINER pour vérifier le rôle sans déclencher RLS

-- Créer une fonction sécurisée pour vérifier si l'utilisateur est admin
-- SECURITY DEFINER permet d'exécuter avec les privilèges du créateur (bypass RLS)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT role = 'admin' FROM profiles WHERE id = auth.uid()),
    FALSE
  );
$$;

-- Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION is_admin() IS
  'Vérifie si l''utilisateur actuel a le rôle admin. '
  'Utilise SECURITY DEFINER pour éviter les récursions RLS.';

-- Recréer les politiques admin sans risque de récursion
DROP POLICY IF EXISTS "Admins can update any announcement" ON announcements;
DROP POLICY IF EXISTS "Admins can delete any announcement" ON announcements;

CREATE POLICY "Admins can update any announcement"
  ON announcements FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete any announcement"
  ON announcements FOR DELETE
  TO authenticated
  USING (is_admin());
