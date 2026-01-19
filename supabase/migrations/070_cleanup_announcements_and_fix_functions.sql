-- Migration: Cleanup announcements table and fix search functions
-- Created: 2026-01-19
-- Description: Remove duplicate columns and update functions to use correct column names with arrival_date

-- Step 1: Drop duplicate columns from announcements table
ALTER TABLE announcements DROP COLUMN IF EXISTS origin_country;
ALTER TABLE announcements DROP COLUMN IF EXISTS origin_city;
ALTER TABLE announcements DROP COLUMN IF EXISTS destination_country;
ALTER TABLE announcements DROP COLUMN IF EXISTS destination_city;
ALTER TABLE announcements DROP COLUMN IF EXISTS max_weight_kg;
ALTER TABLE announcements DROP COLUMN IF EXISTS reserved_weight_kg;

-- Step 2: Update search_announcements function
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
  departure_date TIMESTAMPTZ,
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
  match_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.traveler_id,
    -- Return as origin_country/destination_country for backwards compatibility
    a.departure_country AS origin_country,
    a.departure_city AS origin_city,
    a.arrival_country AS destination_country,
    a.arrival_city AS destination_city,
    a.departure_date,
    a.arrival_date,
    a.available_kg AS max_weight_kg,
    a.price_per_kg,
    a.description,
    a.status,
    a.created_at,
    a.updated_at,
    p.first_name AS traveler_first_name,
    p.last_name AS traveler_last_name,
    p.avatar_url AS traveler_avatar_url,
    COALESCE(
      (SELECT AVG(rating)::NUMERIC
       FROM ratings
       WHERE rated_id = a.traveler_id),
      0
    ) AS traveler_rating,
    COALESCE(
      (SELECT COUNT(*)::BIGINT
       FROM bookings
       WHERE announcement_id = a.id AND status = 'completed'),
      0
    ) AS traveler_services_count,
    (
      CASE WHEN p_departure_country IS NOT NULL AND a.departure_country = p_departure_country THEN 10 ELSE 0 END +
      CASE WHEN p_arrival_country IS NOT NULL AND a.arrival_country = p_arrival_country THEN 10 ELSE 0 END +
      CASE
        WHEN p_departure_date IS NOT NULL THEN
          CASE
            WHEN a.departure_date::DATE = p_departure_date::DATE THEN 20
            WHEN ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 1 THEN 15
            WHEN ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 2 THEN 10
            WHEN ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 3 THEN 5
            ELSE 0
          END
        ELSE 0
      END +
      CASE WHEN p_min_kg IS NOT NULL AND a.available_kg >= p_min_kg THEN 10 ELSE 0 END
    )::NUMERIC AS match_score
  FROM announcements a
  INNER JOIN profiles p ON p.id = a.traveler_id
  WHERE
    a.status IN ('published', 'partially_booked', 'active')
    AND (p_departure_country IS NULL OR a.departure_country = p_departure_country)
    AND (p_arrival_country IS NULL OR a.arrival_country = p_arrival_country)
    AND (
      p_departure_date IS NULL OR
      ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 3
    )
    AND (p_min_kg IS NULL OR a.available_kg >= p_min_kg)
  ORDER BY
    CASE p_sort_by
      WHEN 'price' THEN a.price_per_kg
      WHEN 'rating' THEN COALESCE(
        (SELECT AVG(rating)::NUMERIC
         FROM ratings
         WHERE rated_id = a.traveler_id),
        0
      )
      ELSE NULL
    END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'date' THEN a.departure_date END ASC,
    match_score DESC,
    a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update count_search_announcements function
DROP FUNCTION IF EXISTS count_search_announcements(TEXT, TEXT, DATE, INTEGER);

CREATE OR REPLACE FUNCTION count_search_announcements(
  p_departure_country TEXT DEFAULT NULL,
  p_arrival_country TEXT DEFAULT NULL,
  p_departure_date DATE DEFAULT NULL,
  p_min_kg INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  result_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO result_count
  FROM announcements a
  WHERE
    a.status IN ('published', 'partially_booked', 'active')
    AND (p_departure_country IS NULL OR a.departure_country = p_departure_country)
    AND (p_arrival_country IS NULL OR a.arrival_country = p_arrival_country)
    AND (
      p_departure_date IS NULL OR
      ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 3
    )
    AND (p_min_kg IS NULL OR a.available_kg >= p_min_kg);

  RETURN result_count;
END;
$$ LANGUAGE plpgsql;
