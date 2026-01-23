-- Migration: Fix ratings constraint + make rating update RLS-safe
-- Created: 2026-01-22

-- Drop incorrect unique constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'ratings'
      AND constraint_name = 'ratings_booking_id_key'
  ) THEN
    ALTER TABLE ratings DROP CONSTRAINT ratings_booking_id_key;
  END IF;
END $$;

-- Ensure a unique constraint per booking + rater
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ratings_booking_rater_key'
  ) THEN
    ALTER TABLE ratings
      ADD CONSTRAINT ratings_booking_rater_key UNIQUE (booking_id, rater_id);
  END IF;
END $$;

-- Make rating aggregation update bypass RLS
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
