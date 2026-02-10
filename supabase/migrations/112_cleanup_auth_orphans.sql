-- Clean up orphaned auth records after replica-role deletes

BEGIN;
SET session_replication_role = replica;

DO $$
BEGIN
  -- Identities pointing to missing users
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'identities'
  ) THEN
    EXECUTE 'DELETE FROM auth.identities WHERE user_id::text NOT IN (SELECT id::text FROM auth.users)';
  END IF;

  -- Sessions/refresh tokens for missing users
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'sessions'
  ) THEN
    EXECUTE 'DELETE FROM auth.sessions WHERE user_id::text NOT IN (SELECT id::text FROM auth.users)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'refresh_tokens'
  ) THEN
    EXECUTE 'DELETE FROM auth.refresh_tokens WHERE user_id::text NOT IN (SELECT id::text FROM auth.users)';
  END IF;

  -- MFA tables (if present)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'mfa_factors'
  ) THEN
    EXECUTE 'DELETE FROM auth.mfa_factors WHERE user_id::text NOT IN (SELECT id::text FROM auth.users)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'mfa_challenges'
  ) THEN
    EXECUTE 'DELETE FROM auth.mfa_challenges WHERE factor_id::text NOT IN (SELECT id::text FROM auth.mfa_factors)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'mfa_amr_claims'
  ) THEN
    EXECUTE 'DELETE FROM auth.mfa_amr_claims WHERE session_id::text NOT IN (SELECT id::text FROM auth.sessions)';
  END IF;

  -- One-time tokens (if present)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'one_time_tokens'
  ) THEN
    EXECUTE 'DELETE FROM auth.one_time_tokens WHERE user_id::text NOT IN (SELECT id::text FROM auth.users)';
  END IF;

  -- Flow state (if present)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'flow_state'
  ) THEN
    EXECUTE 'DELETE FROM auth.flow_state WHERE user_id::text NOT IN (SELECT id::text FROM auth.users)';
  END IF;
END $$;

SET session_replication_role = DEFAULT;
COMMIT;
