-- Migration: Add public profiles RPC
-- Created: 2026-01-19
-- Description: Provide safe access to public profile fields for cross-user display

CREATE OR REPLACE FUNCTION get_public_profiles(p_user_ids UUID[])
RETURNS TABLE (
  id UUID,
  firstname TEXT,
  lastname TEXT,
  avatar_url TEXT,
  rating NUMERIC,
  completed_services INTEGER,
  created_at TIMESTAMPTZ,
  kyc_status kyc_status,
  bio TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    firstname,
    lastname,
    avatar_url,
    rating,
    completed_services,
    created_at,
    kyc_status,
    bio
  FROM profiles
  WHERE id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION get_public_profiles(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_profiles(UUID[]) TO anon;

COMMENT ON FUNCTION get_public_profiles(UUID[]) IS
  'Returns limited public profile fields for the given user ids.';
