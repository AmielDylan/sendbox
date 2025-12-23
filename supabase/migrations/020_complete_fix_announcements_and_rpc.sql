-- Migration: Complete fix for announcements table and RPC functions
-- Created: 2024-12-10
-- Description: Correction complète du schéma announcements et des fonctions RPC

-- Étape 1: Vérifier et ajouter traveler_id si manquante
DO $$ 
BEGIN
  -- Vérifier si traveler_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'traveler_id'
  ) THEN
    -- Vérifier si user_id existe (ancien nom possible)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'announcements' 
      AND column_name = 'user_id'
    ) THEN
      ALTER TABLE announcements RENAME COLUMN user_id TO traveler_id;
      RAISE NOTICE 'Colonne user_id renommée en traveler_id';
    ELSE
      -- Ajouter traveler_id
      ALTER TABLE announcements ADD COLUMN traveler_id UUID;
      -- Ajouter la contrainte de clé étrangère si profiles existe
      IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
      ) THEN
        -- Supprimer l'ancienne contrainte si elle existe avec un autre nom
        ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_user_id_fkey;
        -- Ajouter la nouvelle contrainte
        ALTER TABLE announcements 
        ADD CONSTRAINT announcements_traveler_id_fkey 
        FOREIGN KEY (traveler_id) REFERENCES profiles(id) ON DELETE CASCADE;
      END IF;
      RAISE NOTICE 'Colonne traveler_id ajoutée';
    END IF;
  ELSE
    RAISE NOTICE 'Colonne traveler_id existe déjà';
  END IF;
END $$;

-- Étape 2: Vérifier et corriger le type de status
-- Si c'est un ENUM, vérifier les valeurs acceptées
DO $$ 
DECLARE
  v_status_type TEXT;
  v_enum_name TEXT;
BEGIN
  SELECT data_type, udt_name INTO v_status_type, v_enum_name
  FROM information_schema.columns
  WHERE table_schema = 'public' 
  AND table_name = 'announcements' 
  AND column_name = 'status';
  
  IF v_status_type = 'USER-DEFINED' THEN
    RAISE NOTICE 'Status est un ENUM de type: %', v_enum_name;
    -- Vérifier les valeurs de l'enum
    PERFORM 1 FROM pg_enum 
    WHERE enumlabel = 'active' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = v_enum_name);
    
    IF NOT FOUND THEN
      RAISE NOTICE 'La valeur "active" n''existe pas dans l''enum, ajout...';
      -- Ajouter 'active' à l'enum si possible
      BEGIN
        ALTER TYPE announcement_status ADD VALUE IF NOT EXISTS 'active';
        RAISE NOTICE 'Valeur "active" ajoutée à l''enum';
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Impossible d''ajouter "active" à l''enum: %', SQLERRM;
      END;
    END IF;
    
    -- Ajouter 'published' et 'partially_booked' si nécessaire
    BEGIN
      ALTER TYPE announcement_status ADD VALUE IF NOT EXISTS 'published';
      ALTER TYPE announcement_status ADD VALUE IF NOT EXISTS 'partially_booked';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Impossible d''ajouter des valeurs à l''enum: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Status est de type: %', v_status_type;
  END IF;
END $$;

-- Étape 3: S'assurer que toutes les colonnes nécessaires existent
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS origin_country TEXT,
ADD COLUMN IF NOT EXISTS origin_city TEXT,
ADD COLUMN IF NOT EXISTS destination_country TEXT,
ADD COLUMN IF NOT EXISTS destination_city TEXT,
ADD COLUMN IF NOT EXISTS departure_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS arrival_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS max_weight_kg NUMERIC,
ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS reserved_weight_kg NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Étape 4: Recréer les fonctions RPC avec gestion flexible du statut
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
       WHERE announcement_id = a.id AND status::TEXT = 'completed'),
      0
    ) AS traveler_services_count,
    -- Calcul du match score
    (
      CASE WHEN p_departure_country IS NOT NULL AND a.origin_country = p_departure_country THEN 10 ELSE 0 END +
      CASE WHEN p_arrival_country IS NOT NULL AND a.destination_country = p_arrival_country THEN 10 ELSE 0 END +
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
      CASE WHEN p_min_kg IS NOT NULL AND a.max_weight_kg >= p_min_kg THEN 10 ELSE 0 END
    )::NUMERIC AS match_score
  FROM announcements a
  INNER JOIN profiles p ON p.id = a.traveler_id
  WHERE
    -- Gérer à la fois ENUM et TEXT pour le statut
    (a.status::TEXT IN ('published', 'partially_booked', 'active', 'draft') 
     OR a.status IN ('published', 'partially_booked', 'active', 'draft'))
    AND (p_departure_country IS NULL OR a.origin_country = p_departure_country)
    AND (p_arrival_country IS NULL OR a.destination_country = p_arrival_country)
    AND (
      p_departure_date IS NULL OR
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
    -- Gérer à la fois ENUM et TEXT pour le statut
    (a.status::TEXT IN ('published', 'partially_booked', 'active', 'draft')
     OR a.status IN ('published', 'partially_booked', 'active', 'draft'))
    AND (p_departure_country IS NULL OR a.origin_country = p_departure_country)
    AND (p_arrival_country IS NULL OR a.destination_country = p_arrival_country)
    AND (
      p_departure_date IS NULL OR
      ABS(EXTRACT(DAY FROM (a.departure_date::DATE - p_departure_date::DATE))) <= 3
    )
    AND (p_min_kg IS NULL OR a.max_weight_kg >= p_min_kg);
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaires
COMMENT ON FUNCTION search_announcements IS 'Recherche d''annonces avec filtres et tri. Gère les statuts ENUM et TEXT.';
COMMENT ON FUNCTION count_search_announcements IS 'Compte le nombre total d''annonces correspondant aux critères. Gère les statuts ENUM et TEXT.';









