-- Migration: Verify profile exists and fix RLS for authenticated users
-- Created: 2026-01-19
-- Description: Ensure users can read their own profile without issues

-- First, let's make sure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
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

-- Create the SIMPLEST possible policy - users can read their own profile
CREATE POLICY "enable_read_own_profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "enable_update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup
CREATE POLICY "enable_insert_own_profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Grant basic SELECT permission to authenticated role
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT INSERT ON profiles TO authenticated;

-- Add helpful comment
COMMENT ON TABLE profiles IS 'RLS enabled: users can only access their own profile using auth.uid()';
