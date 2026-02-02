-- Migration: Update profile roles to user/partner/admin
-- Created: 2026-01-30
-- Description: Normalize profiles.role values and update enum

-- Drop policies depending on profiles.role to allow type change
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Admins can view feedback" ON public.feedback;
DROP POLICY IF EXISTS "Admins can read all KYC documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Admins can create audit logs" ON public.admin_audit_logs;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.audit_logs';
  END IF;
END $$;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can update any announcement" ON public.announcements;
DROP POLICY IF EXISTS "Admins can delete any announcement" ON public.announcements;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND constraint_type = 'CHECK'
      AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    ALTER TYPE user_role RENAME TO user_role_old;
  END IF;
END $$;

CREATE TYPE user_role AS ENUM ('user', 'partner', 'admin');

ALTER TABLE public.profiles
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.profiles
  ALTER COLUMN role TYPE user_role
  USING (
    CASE
      WHEN role::text IN ('sender') THEN 'user'::user_role
      WHEN role::text IN ('traveler', 'both', 'partner') THEN 'partner'::user_role
      WHEN role::text IN ('admin') THEN 'admin'::user_role
      WHEN role::text IN ('user') THEN 'user'::user_role
      ELSE 'user'::user_role
    END
  );

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'user';

COMMENT ON COLUMN public.profiles.role IS
  'user | partner | admin - définit les permissions d''accès';

DROP TYPE IF EXISTS user_role_old;

-- Recreate admin policies using is_admin() to avoid direct role dependency
CREATE POLICY "Admins can view waitlist"
  ON public.waitlist FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can view feedback"
  ON public.feedback FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can read all KYC documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND is_admin()
  );

CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can view all announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update announcements"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update any announcement"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete any announcement"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (is_admin());
