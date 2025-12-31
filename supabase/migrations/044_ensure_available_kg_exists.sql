-- Migration: S'assurer que available_kg existe
-- Created: 2024-12-26
-- Description: Correction finale pour garantir que available_kg existe

-- Vérifier et créer available_kg si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'announcements'
    AND column_name = 'available_kg'
  ) THEN
    RAISE NOTICE 'Creating available_kg column';
    ALTER TABLE announcements ADD COLUMN available_kg NUMERIC NOT NULL DEFAULT 0;
    ALTER TABLE announcements ADD CONSTRAINT available_kg_positive CHECK (available_kg >= 0);
  ELSE
    RAISE NOTICE 'available_kg column already exists';
  END IF;
  
  -- S'assurer que reserved_kg existe aussi
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'announcements'
    AND column_name = 'reserved_kg'
  ) THEN
    RAISE NOTICE 'Creating reserved_kg column';
    ALTER TABLE announcements ADD COLUMN reserved_kg NUMERIC DEFAULT 0;
    ALTER TABLE announcements ADD CONSTRAINT reserved_kg_positive CHECK (reserved_kg >= 0);
  ELSE
    RAISE NOTICE 'reserved_kg column already exists';
  END IF;
END $$;

-- Mettre à jour les commentaires
COMMENT ON COLUMN announcements.available_kg IS 'Poids maximal disponible pour le transport en kilogrammes';
COMMENT ON COLUMN announcements.reserved_kg IS 'Poids déjà réservé en kilogrammes';
