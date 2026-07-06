-- Migration: ratings published-only aggregation
-- Description:
--   Blind reviews are stored as pending/submitted before publication.
--   Only published reviews should affect the visible profile rating.

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
  WHERE rated_id = NEW.rated_id
    AND status = 'published';

  UPDATE profiles
  SET rating = v_avg_rating
  WHERE id = NEW.rated_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_rating_on_insert ON ratings;
CREATE TRIGGER update_rating_on_insert
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

DROP TRIGGER IF EXISTS update_rating_on_update ON ratings;
CREATE TRIGGER update_rating_on_update
AFTER UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();
