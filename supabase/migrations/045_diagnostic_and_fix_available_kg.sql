-- Migration: Diagnostic et correction finale pour available_kg
-- Created: 2024-12-26

DO $$
DECLARE
  col_count INTEGER;
  has_available BOOLEAN;
  has_max_weight BOOLEAN;
BEGIN
  -- Compter les colonnes de la table announcements
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'announcements';
  
  RAISE NOTICE 'Total columns in announcements: %', col_count;
  
  -- Vérifier available_kg
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'announcements'
    AND column_name = 'available_kg'
  ) INTO has_available;
  
  -- Vérifier max_weight_kg
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'announcements'
    AND column_name = 'max_weight_kg'
  ) INTO has_max_weight;
  
  RAISE NOTICE 'Has available_kg: %, Has max_weight_kg: %', has_available, has_max_weight;
  
  -- Si max_weight_kg existe mais pas available_kg, renommer
  IF has_max_weight AND NOT has_available THEN
    RAISE NOTICE 'RENAMING max_weight_kg to available_kg';
    ALTER TABLE announcements RENAME COLUMN max_weight_kg TO available_kg;
  END IF;
  
  -- Si aucune des deux n'existe, créer available_kg
  IF NOT has_available AND NOT has_max_weight THEN
    RAISE NOTICE 'CREATING available_kg column';
    ALTER TABLE announcements ADD COLUMN available_kg NUMERIC NOT NULL DEFAULT 0;
  END IF;
  
  -- Si max_weight_kg existe toujours (avec available_kg), supprimer max_weight_kg
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'announcements'
    AND column_name = 'max_weight_kg'
  ) INTO has_max_weight;
  
  IF has_max_weight THEN
    RAISE NOTICE 'DROPPING max_weight_kg column';
    ALTER TABLE announcements DROP COLUMN max_weight_kg;
  END IF;
  
  -- S'assurer que available_kg a les bonnes contraintes
  ALTER TABLE announcements ALTER COLUMN available_kg SET DEFAULT 0;
  ALTER TABLE announcements ALTER COLUMN available_kg SET NOT NULL;
  
  -- Vérifier et créer la contrainte si nécessaire
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'available_kg_positive'
    AND conrelid = 'announcements'::regclass
  ) THEN
    ALTER TABLE announcements ADD CONSTRAINT available_kg_positive CHECK (available_kg >= 0);
  END IF;
  
  RAISE NOTICE 'Migration completed successfully';
END $$;
