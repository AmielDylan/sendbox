-- Migration: Fix booking status value in search function
-- Created: 2026-01-19
-- Description: Use 'delivered' instead of 'completed' for booking_status enum

-- Drop and recreate search_announcements with correct booking status
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.traveler_id,
    a.departure_country AS origin_country,
    a.departure_city AS origin_city,
    a.arrival_country AS destination_country,
    a.arrival_city AS destination_city,
    a.departure_date,
    a.arrival_date,
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
       WHERE rated_id = a.traveler_id),
      0
    ) AS traveler_rating,
    COALESCE(
      (SELECT COUNT(*)::BIGINT
       FROM bookings b
       WHERE b.announcement_id = a.id AND b.status = 'delivered'),
      0
    ) AS traveler_services_count,
    (
      CASE WHEN p_departure_country IS NOT NULL AND a.departure_country = p_departure_country THEN 10 ELSE 0 END +
      CASE WHEN p_arrival_country IS NOT NULL AND a.arrival_country = p_arrival_country THEN 10 ELSE 0 END +
      CASE
        WHEN p_departure_date IS NOT NULL THEN
          CASE
            WHEN a.departure_date::DATE = p_departure_date THEN 20
            WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date::DATE, p_departure_date))) <= 1 THEN 15
            WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date::DATE, p_departure_date))) <= 2 THEN 10
            WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date::DATE, p_departure_date))) <= 3 THEN 5
            ELSE 0
          END
        ELSE 0
      END +
      CASE WHEN p_min_kg IS NOT NULL AND a.available_kg >= p_min_kg THEN 10 ELSE 0 END
    )::NUMERIC AS match_score
  FROM announcements a
  LEFT JOIN profiles p ON p.id = a.traveler_id
  WHERE
    a.status IN ('published', 'partially_booked', 'active')
    AND (p_departure_country IS NULL OR a.departure_country = p_departure_country)
    AND (p_arrival_country IS NULL OR a.arrival_country = p_arrival_country)
    AND (
      p_departure_date IS NULL OR
      ABS(EXTRACT(DAY FROM AGE(a.departure_date::DATE, p_departure_date))) <= 3
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
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER) TO anon;

-- Add comment
COMMENT ON FUNCTION search_announcements IS 'Public search for announcements. No authentication required. Uses delivered status for completed bookings.';
