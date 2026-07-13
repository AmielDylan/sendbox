-- Migration: expose public trust score fields
-- Created: 2026-07-13
-- Description: Make V1 trust levels available to public profile and search surfaces.

DROP FUNCTION IF EXISTS get_public_profiles(UUID[]);

CREATE OR REPLACE FUNCTION get_public_profiles(p_user_ids UUID[])
RETURNS TABLE (
  id UUID,
  firstname TEXT,
  lastname TEXT,
  avatar_url TEXT,
  rating NUMERIC,
  completed_services INTEGER,
  trust_score NUMERIC,
  completed_count INTEGER,
  disputed_count INTEGER,
  verification_status verification_status_enum,
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
    trust_score,
    completed_count,
    disputed_count,
    verification_status,
    created_at,
    kyc_status,
    bio
  FROM profiles
  WHERE id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION get_public_profiles(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_profiles(UUID[]) TO anon;

COMMENT ON FUNCTION get_public_profiles(UUID[]) IS
  'Returns limited public profile fields, including V1 trust score fields, for the given user ids.';

DROP FUNCTION IF EXISTS search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION search_announcements(
  p_departure_country TEXT DEFAULT NULL,
  p_arrival_country TEXT DEFAULT NULL,
  p_departure_date DATE DEFAULT NULL,
  p_min_kg INTEGER DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'date',
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  traveler_id UUID,
  origin_country TEXT,
  origin_city TEXT,
  destination_country TEXT,
  destination_city TEXT,
  departure_date DATE,
  arrival_date DATE,
  max_weight_kg NUMERIC,
  price_per_kg NUMERIC,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  traveler_first_name TEXT,
  traveler_last_name TEXT,
  traveler_avatar_url TEXT,
  traveler_rating NUMERIC,
  traveler_services_count BIGINT,
  traveler_trust_score NUMERIC,
  traveler_completed_count INTEGER,
  traveler_disputed_count INTEGER,
  match_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weight_departure NUMERIC := 10;
  weight_arrival NUMERIC := 10;
  weight_date NUMERIC := 20;
  weight_min_kg NUMERIC := 10;
BEGIN
  RETURN QUERY
  SELECT
    scored.id,
    scored.traveler_id,
    scored.origin_country,
    scored.origin_city,
    scored.destination_country,
    scored.destination_city,
    scored.departure_date,
    scored.arrival_date,
    scored.max_weight_kg,
    scored.price_per_kg,
    scored.description,
    scored.status,
    scored.created_at,
    scored.updated_at,
    scored.traveler_first_name,
    scored.traveler_last_name,
    scored.traveler_avatar_url,
    scored.traveler_rating,
    scored.traveler_services_count,
    scored.traveler_trust_score,
    scored.traveler_completed_count,
    scored.traveler_disputed_count,
    CASE
      WHEN scored.max_score > 0 THEN ROUND((scored.score / scored.max_score) * 100)
      ELSE 0
    END::NUMERIC AS match_score
  FROM (
    SELECT
      a.id,
      a.traveler_id,
      a.departure_country AS origin_country,
      a.departure_city AS origin_city,
      a.arrival_country AS destination_country,
      a.arrival_city AS destination_city,
      a.departure_date::DATE,
      a.arrival_date::DATE,
      a.available_kg AS max_weight_kg,
      a.price_per_kg,
      a.description,
      a.status::TEXT,
      a.created_at,
      a.updated_at,
      COALESCE(p.firstname, '') AS traveler_first_name,
      COALESCE(p.lastname, '') AS traveler_last_name,
      p.avatar_url AS traveler_avatar_url,
      COALESCE(
        (SELECT AVG(rating)::NUMERIC
         FROM ratings
         WHERE rated_id = a.traveler_id
           AND status = 'published'),
        0
      ) AS traveler_rating,
      COALESCE(p.completed_count, 0)::BIGINT AS traveler_services_count,
      COALESCE(p.trust_score, 0)::NUMERIC AS traveler_trust_score,
      COALESCE(p.completed_count, 0)::INTEGER AS traveler_completed_count,
      COALESCE(p.disputed_count, 0)::INTEGER AS traveler_disputed_count,
      (
        CASE WHEN p_departure_country IS NOT NULL THEN weight_departure ELSE 0 END +
        CASE WHEN p_arrival_country IS NOT NULL THEN weight_arrival ELSE 0 END +
        CASE WHEN p_departure_date IS NOT NULL THEN weight_date ELSE 0 END +
        CASE WHEN p_min_kg IS NOT NULL THEN weight_min_kg ELSE 0 END
      )::NUMERIC AS max_score,
      (
        CASE WHEN p_departure_country IS NOT NULL AND a.departure_country = p_departure_country THEN weight_departure ELSE 0 END +
        CASE WHEN p_arrival_country IS NOT NULL AND a.arrival_country = p_arrival_country THEN weight_arrival ELSE 0 END +
        CASE
          WHEN p_departure_date IS NOT NULL THEN
            CASE
              WHEN a.departure_date = p_departure_date THEN weight_date
              WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date, p_departure_date))) <= 1 THEN weight_date * 0.75
              WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date, p_departure_date))) <= 2 THEN weight_date * 0.5
              WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date, p_departure_date))) <= 3 THEN weight_date * 0.25
              ELSE 0
            END
          ELSE 0
        END +
        CASE WHEN p_min_kg IS NOT NULL AND a.available_kg >= p_min_kg THEN weight_min_kg ELSE 0 END
      )::NUMERIC AS score
    FROM announcements a
    LEFT JOIN profiles p ON p.id = a.traveler_id
    WHERE
      a.status IN ('published', 'partially_booked', 'active')
      AND (p_departure_country IS NULL OR a.departure_country = p_departure_country)
      AND (p_arrival_country IS NULL OR a.arrival_country = p_arrival_country)
      AND (
        p_departure_date IS NULL OR
        ABS(EXTRACT(DAY FROM AGE(a.departure_date, p_departure_date))) <= 3
      )
      AND (p_min_kg IS NULL OR a.available_kg >= p_min_kg)
  ) scored
  ORDER BY
    CASE WHEN p_sort_by = 'price' THEN scored.price_per_kg END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'rating' THEN scored.traveler_trust_score END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'date' THEN scored.departure_date END ASC,
    match_score DESC,
    scored.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER) TO anon;

COMMENT ON FUNCTION search_announcements IS
  'Public search for announcements. match_score is normalized to 0-100 and V1 traveler trust fields are exposed.';
