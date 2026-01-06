-- Consolidation des fonctions is_admin() en une seule version cohérente
-- Problème: Deux fonctions is_admin() avec signatures différentes créent confusion
-- Solution: Une seule fonction is_admin() SECURITY DEFINER sans paramètres

-- ÉTAPE 1: Créer/mettre à jour is_admin() sans paramètres AVANT de supprimer l'ancienne
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

-- ÉTAPE 2: Supprimer les politiques qui dépendent de is_admin(UUID)
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- ÉTAPE 3: Supprimer les autres politiques qui dépendent de is_admin(UUID)
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
    DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
    DROP POLICY IF EXISTS "Admins can create audit logs" ON admin_audit_logs;
  END IF;
END $$;

-- ÉTAPE 4: Maintenant on peut supprimer l'ancienne fonction is_admin(UUID)
DROP FUNCTION IF EXISTS is_admin(UUID);

-- ÉTAPE 5: Recréer toutes les politiques avec is_admin() sans paramètres
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
TO authenticated
USING (is_admin());

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
    EXECUTE 'CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT TO authenticated USING (is_admin())';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_logs') THEN
    EXECUTE 'CREATE POLICY "Admins can view audit logs" ON admin_audit_logs FOR SELECT TO authenticated USING (is_admin())';
    EXECUTE 'CREATE POLICY "Admins can create audit logs" ON admin_audit_logs FOR INSERT TO authenticated WITH CHECK (is_admin())';
  END IF;
END $$;

-- Commentaire pour documentation
COMMENT ON FUNCTION is_admin() IS
  'Vérifie si l''utilisateur actuel (auth.uid()) a le rôle admin. '
  'Utilise SECURITY DEFINER pour éviter les récursions RLS. '
  'Version consolidée - ne plus utiliser is_admin(UUID).';
