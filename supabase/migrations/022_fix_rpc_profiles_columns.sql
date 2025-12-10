-- Migration: Fix RPC functions to use correct profiles column names
-- Created: 2024-12-10
-- Description: Correction des fonctions RPC pour utiliser les bons noms de colonnes de profiles

-- Vérifier les colonnes de profiles et corriger les fonctions
DO $$ 
DECLARE
  v_has_first_name BOOLEAN;
  v_has_firstname BOOLEAN;
BEGIN
  -- Vérifier si first_name existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'first_name'
  ) INTO v_has_first_name;

  -- Vérifier si firstname existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'firstname'
  ) INTO v_has_firstname;

  RAISE NOTICE 'first_name existe: %, firstname existe: %', v_has_first_name, v_has_firstname;
END $$;

-- Recréer les fonctions avec les bons noms de colonnes
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
    a.id,
    a.traveler_id,
    a.origin_country,
    a.origin_city,
    a.destination_country,
    a.destination_city,
    a.departure_date,
    a.max_weight_kg,
    a.price_per_kg,
    a.description,
    a.status::TEXT,
    a.created_at,
    a.updated_at,
    -- Utiliser firstname et lastname (sans underscore)
    p.firstname AS traveler_first_name,
    p.lastname AS traveler_last_name,
    (SELECT avatar_url FROM profiles WHERE id = a.traveler_id) AS traveler_avatar_url,
    COALESCE(
      (SELECT AVG(rating)::NUMERIC
       FROM ratings
       WHERE rated_id = a.traveler_id),
      0
    ) AS traveler_rating,
    COALESCE(
      (SELECT COUNT(*)::BIGINT
       FROM bookings
       WHERE announcement_id = a.id AND status::TEXT = 'completed'),
      0
    ) AS traveler_services_count,
    -- Calcul du match score
    (
      CASE WHEN p_departure_country IS NOT NULL AND a.origin_country = p_departure_country THEN 10 ELSE 0 END +
      CASE WHEN p_arrival_country IS NOT NULL AND a.destination_country = p_arrival_country THEN 10 ELSE 0 END +
      CASE 
        WHEN p_departure_date IS NOT NULL AND a.departure_date IS NOT NULL THEN
          CASE 
            WHEN a.departure_date::DATE = p_departure_date::DATE THEN 20
            WHEN ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 1 THEN 15
            WHEN ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 2 THEN 10
            WHEN ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 3 THEN 5
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
      ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 3
    )
    AND (p_min_kg IS NULL OR a.max_weight_kg >= p_min_kg)
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

CREATE OR REPLACE FUNCTION count_search_announcements(
  p_departure_country TEXT DEFAULT NULL,
  p_arrival_country TEXT DEFAULT NULL,
  p_departure_date DATE DEFAULT NULL,
  p_min_kg INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM announcements a
  WHERE
    a.status::TEXT IN ('published', 'partially_booked', 'active', 'draft')
    AND (p_departure_country IS NULL OR a.origin_country = p_departure_country)
    AND (p_arrival_country IS NULL OR a.destination_country = p_arrival_country)
    AND (
      p_departure_date IS NULL OR
      a.departure_date IS NULL OR
      ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 3
    )
    AND (p_min_kg IS NULL OR a.max_weight_kg >= p_min_kg);
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

