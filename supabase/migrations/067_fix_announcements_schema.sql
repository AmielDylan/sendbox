-- Migration: Fix announcements table schema
-- Created: 2024-12-10
-- Description: Vérifie et corrige le schéma de la table announcements

-- Vérifier et ajouter la colonne traveler_id si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'announcements' 
    AND column_name = 'traveler_id'
  ) THEN
    -- Si la table existe mais sans traveler_id, l'ajouter
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'announcements'
    ) THEN
      -- Vérifier s'il y a une colonne user_id à convertir
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'announcements' 
        AND column_name = 'user_id'
      ) THEN
        -- Renommer user_id en traveler_id
        ALTER TABLE announcements RENAME COLUMN user_id TO traveler_id;
      ELSE
        -- Ajouter traveler_id
        ALTER TABLE announcements ADD COLUMN traveler_id UUID REFERENCES profiles(id);
      END IF;
    END IF;
  END IF;
END $$;

-- Vérifier et ajouter les autres colonnes nécessaires si elles n'existent pas
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
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Créer la table si elle n'existe pas du tout
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  origin_country TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  destination_country TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  departure_date TIMESTAMPTZ NOT NULL,
  arrival_date TIMESTAMPTZ NOT NULL,
  max_weight_kg NUMERIC NOT NULL CHECK (max_weight_kg > 0),
  price_per_kg NUMERIC NOT NULL CHECK (price_per_kg > 0),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'published', 'partially_booked', 'completed', 'cancelled')),
  reserved_weight_kg NUMERIC DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS announcements_traveler_id_idx ON announcements(traveler_id);
CREATE INDEX IF NOT EXISTS announcements_status_idx ON announcements(status);
CREATE INDEX IF NOT EXISTS announcements_departure_date_idx ON announcements(departure_date);
CREATE INDEX IF NOT EXISTS announcements_origin_country_idx ON announcements(origin_country);
CREATE INDEX IF NOT EXISTS announcements_destination_country_idx ON announcements(destination_country);

-- RLS Policies pour announcements
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy supprimée - sera créée dans une migration ultérieure si nécessaire
-- DROP POLICY IF EXISTS "Users can view all published announcements" ON announcements;

DROP POLICY IF EXISTS "Users can view their own announcements" ON announcements;
CREATE POLICY "Users can view their own announcements"
ON announcements FOR SELECT
TO authenticated
USING (traveler_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own announcements" ON announcements;
CREATE POLICY "Users can create their own announcements"
ON announcements FOR INSERT
TO authenticated
WITH CHECK (traveler_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own announcements" ON announcements;
CREATE POLICY "Users can update their own announcements"
ON announcements FOR UPDATE
TO authenticated
USING (traveler_id = auth.uid());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_announcements_updated_at ON announcements;
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON announcements
FOR EACH ROW
EXECUTE FUNCTION update_announcements_updated_at();

