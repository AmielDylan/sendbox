-- Migration: Diagnose and fix profile access issues
-- Created: 2026-01-19
-- Description: Create diagnostic function and ensure RLS works for all users

-- Create a diagnostic function to check profile access
CREATE OR REPLACE FUNCTION diagnose_profile_access(user_id UUID)
RETURNS TABLE (
  profile_exists BOOLEAN,
  can_select BOOLEAN,
  auth_uid UUID,
  target_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXISTS(SELECT 1 FROM profiles WHERE id = user_id) as profile_exists,
    EXISTS(SELECT 1 FROM profiles WHERE id = user_id AND id = auth.uid()) as can_select,
    auth.uid() as auth_uid,
    user_id as target_id,
    CASE
      WHEN NOT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) THEN 'Profile does not exist'
      WHEN auth.uid() IS NULL THEN 'Not authenticated'
      WHEN auth.uid() != user_id THEN 'Auth UID does not match target ID'
      ELSE 'Should work'
    END as error_message;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION diagnose_profile_access(UUID) TO authenticated;

-- Drop existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'profiles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- Create the ABSOLUTE SIMPLEST policy possible
-- This should work for ANY authenticated user viewing their own profile
CREATE POLICY "allow_own_profile_select"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "allow_own_profile_update"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow profile creation
CREATE POLICY "allow_profile_insert"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Make absolutely sure the authenticated role has SELECT permission
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

COMMENT ON FUNCTION diagnose_profile_access IS 'Diagnostic function to check why a user cannot access their profile';
