-- Migration: Fix search_announcements return types
-- Created: 2024-12-10
-- Description: Correction des types de retour pour correspondre exactement à la structure

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
    a.id::UUID,
    a.traveler_id::UUID,
    a.origin_country::TEXT,
    a.origin_city::TEXT,
    a.destination_country::TEXT,
    a.destination_city::TEXT,
    a.departure_date::TIMESTAMPTZ,
    a.max_weight_kg::NUMERIC,
    a.price_per_kg::NUMERIC,
    COALESCE(a.description, '')::TEXT,
    a.status::TEXT,
    a.created_at::TIMESTAMPTZ,
    a.updated_at::TIMESTAMPTZ,
    COALESCE(p.firstname, '')::TEXT AS traveler_first_name,
    COALESCE(p.lastname, '')::TEXT AS traveler_last_name,
    COALESCE(p.avatar_url, '')::TEXT AS traveler_avatar_url,
    COALESCE(
      (SELECT AVG(r.rating)::NUMERIC
       FROM ratings r
       WHERE r.rated_id = a.traveler_id),
      0
    )::NUMERIC AS traveler_rating,
    COALESCE(
      (SELECT COUNT(*)::BIGINT
       FROM bookings b
       WHERE b.announcement_id = a.id AND b.status::TEXT = 'completed'),
      0
    )::BIGINT AS traveler_services_count,
    -- Calcul du match score
    (
      CASE WHEN p_departure_country IS NOT NULL AND a.origin_country = p_departure_country THEN 10 ELSE 0 END +
      CASE WHEN p_arrival_country IS NOT NULL AND a.destination_country = p_arrival_country THEN 10 ELSE 0 END +
      CASE 
        WHEN p_departure_date IS NOT NULL AND a.departure_date IS NOT NULL THEN
          CASE 
            WHEN a.departure_date::DATE = p_departure_date::DATE THEN 20
            WHEN ABS((a.departure_date::DATE - p_departure_date::DATE)) <= 1 THEN 15
            WHEN ABS((a.departure_date::DATE - p_departure_date::DATE)) <= 2 THEN 10
            WHEN ABS((a.departure_date::DATE - p_departure_date::DATE)) <= 3 THEN 5
            ELSE 0
          END
        ELSE 0
      END +
      CASE WHEN p_min_kg IS NOT NULL AND a.max_weight_kg >= p_min_kg THEN 10 ELSE 0 END
    )::NUMERIC AS match_score
  FROM announcements a
  INNER JOIN profiles p ON p.id = a.traveler_id
  WHERE
    a.status::TEXT IN ('published', 'partially_booked', 'active', 'draft')
    AND (p_departure_country IS NULL OR a.origin_country = p_departure_country)
    AND (p_arrival_country IS NULL OR a.destination_country = p_arrival_country)
    AND (
      p_departure_date IS NULL OR
      a.departure_date IS NULL OR
      ABS((a.departure_date::DATE - p_departure_date::DATE)) <= 3
    )
    AND (p_min_kg IS NULL OR a.max_weight_kg >= p_min_kg)
  ORDER BY
    CASE p_sort_by
      WHEN 'price' THEN a.price_per_kg
      WHEN 'rating' THEN COALESCE(
        (SELECT AVG(r.rating)::NUMERIC
         FROM ratings r
         WHERE r.rated_id = a.traveler_id),
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





