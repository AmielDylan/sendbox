-- Migration: Fix profiles RLS infinite recursion
-- Created: 2024-12-11
-- Description: Correction de la récursion infinie dans les politiques RLS de profiles

-- Le problème: Les politiques RLS qui vérifient le rôle admin dans profiles
-- créent une récursion infinie car elles nécessitent d'accéder à profiles
-- pour vérifier si l'utilisateur peut accéder à profiles.

-- Solution: Créer une fonction SECURITY DEFINER qui contourne RLS
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM profiles
  WHERE id = user_id;
  
  RETURN COALESCE(v_role, 'user') = 'admin';
END;
$$;

-- Supprimer les anciennes politiques qui causent la récursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view audit logs" ON admin_audit_logs;
DROP POLICY IF EXISTS "Admins can create audit logs" ON admin_audit_logs;

-- Recréer les politiques avec la fonction qui contourne RLS
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Bookings
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Transactions
CREATE POLICY "Admins can view all transactions"
ON transactions FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Admin audit logs
CREATE POLICY "Admins can view audit logs"
ON admin_audit_logs FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create audit logs"
ON admin_audit_logs FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Ajouter des politiques pour que les utilisateurs puissent voir leur propre profil
-- sans créer de récursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Commentaires
COMMENT ON FUNCTION is_admin IS 'Vérifie si un utilisateur est admin sans créer de récursion RLS (SECURITY DEFINER)';









