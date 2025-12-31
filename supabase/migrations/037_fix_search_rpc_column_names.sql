-- Migration: Fix search_announcements column names
-- Les colonnes profiles utilisent firstname/lastname (sans underscore)
-- Mais la fonction RPC utilisait first_name/last_name (avec underscore)

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
  departure_country TEXT,
  departure_city TEXT,
  arrival_country TEXT,
  arrival_city TEXT,
  departure_date TIMESTAMPTZ,
  available_kg NUMERIC,
  price_per_kg NUMERIC,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  traveler_firstname TEXT,
  traveler_lastname TEXT,
  traveler_avatar_url TEXT,
  traveler_rating NUMERIC,
  traveler_services_count BIGINT,
  match_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id::UUID,
    a.traveler_id::UUID,
    a.departure_country::TEXT,
    a.departure_city::TEXT,
    a.arrival_country::TEXT,
    a.arrival_city::TEXT,
    a.departure_date::TIMESTAMPTZ,
    a.available_kg::NUMERIC,
    a.price_per_kg::NUMERIC,
    COALESCE(a.description, '')::TEXT,
    a.status::TEXT,
    a.created_at::TIMESTAMPTZ,
    a.updated_at::TIMESTAMPTZ,
    p.firstname::TEXT,
    p.lastname::TEXT,
    p.avatar_url::TEXT,
    COALESCE(rating_stats.avg_rating, 0)::NUMERIC,
    COALESCE(rating_stats.total_ratings, 0)::BIGINT,
    CASE
      WHEN p_departure_country IS NOT NULL AND p_arrival_country IS NOT NULL THEN
        CASE
          WHEN a.departure_country = p_departure_country AND a.arrival_country = p_arrival_country THEN 100
          WHEN a.departure_country = p_departure_country OR a.arrival_country = p_arrival_country THEN 75
          ELSE 50
        END
      WHEN p_departure_country IS NOT NULL THEN
        CASE WHEN a.departure_country = p_departure_country THEN 80 ELSE 40 END
      WHEN p_arrival_country IS NOT NULL THEN
        CASE WHEN a.arrival_country = p_arrival_country THEN 80 ELSE 40 END
      ELSE 50
    END::NUMERIC
  FROM announcements a
  LEFT JOIN profiles p ON a.traveler_id = p.id
  LEFT JOIN (
    SELECT
      traveler_id,
      AVG(rating) as avg_rating,
      COUNT(*) as total_ratings
    FROM ratings
    GROUP BY traveler_id
  ) rating_stats ON a.traveler_id = rating_stats.traveler_id
  WHERE
    a.status IN ('active', 'published', 'partially_booked')
    AND (p_departure_country IS NULL OR a.departure_country = p_departure_country)
    AND (p_arrival_country IS NULL OR a.arrival_country = p_arrival_country)
    AND (p_departure_date IS NULL OR DATE(a.departure_date) >= p_departure_date)
    AND (p_min_kg IS NULL OR a.available_kg >= p_min_kg)
  ORDER BY
    CASE
      WHEN p_sort_by = 'price_asc' THEN a.price_per_kg
      ELSE NULL
    END ASC,
    CASE
      WHEN p_sort_by = 'price_desc' THEN a.price_per_kg
      ELSE NULL
    END DESC,
    CASE
      WHEN p_sort_by = 'date' THEN a.departure_date
      ELSE NULL
    END ASC,
    CASE
      WHEN p_sort_by = 'rating' THEN COALESCE(rating_stats.avg_rating, 0)
      ELSE NULL
    END DESC,
    a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
