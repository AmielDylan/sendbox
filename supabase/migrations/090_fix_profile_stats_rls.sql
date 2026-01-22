-- Migration: Ensure ratings + completed services updates bypass RLS
-- Created: 2026-01-22

-- Make rating aggregation updates RLS-safe
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_avg_rating NUMERIC;
BEGIN
  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM ratings
  WHERE rated_id = NEW.rated_id;

  UPDATE profiles
  SET rating = v_avg_rating
  WHERE id = NEW.rated_id;

  RETURN NEW;
END;
$$;

-- Make completed services increment RLS-safe
CREATE OR REPLACE FUNCTION increment_completed_services(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  UPDATE profiles
  SET completed_services = COALESCE(completed_services, 0) + 1
  WHERE id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_rating() TO authenticated;
GRANT EXECUTE ON FUNCTION increment_completed_services(UUID) TO authenticated;
