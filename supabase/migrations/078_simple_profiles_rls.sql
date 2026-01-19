-- Migration: Simplified profiles RLS policies
-- Created: 2026-01-19
-- Description: Simple policies to ensure users can always access their own profile

-- Disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
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

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create SIMPLE policies - just allow users to access their own profile

-- 1. Users can view their own profile
CREATE POLICY "select_own_profile"
ON profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- 2. Users can update their own profile
CREATE POLICY "update_own_profile"
ON profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 3. Users can insert their own profile (for signup)
CREATE POLICY "insert_own_profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Add comment
COMMENT ON TABLE profiles IS 'User profiles with simple RLS: users can only access their own profile.';
