-- Migration: Renommer max_weight_kg en available_kg (si nécessaire)
-- Created: 2024-12-26
-- Description: Corriger le problème où max_weight_kg a été supprimée mais available_kg n'existe pas

-- Vérifier quelle colonne existe et agir en conséquence
DO $$
DECLARE
  has_max_weight BOOLEAN;
  has_available_kg BOOLEAN;
BEGIN
  -- Vérifier si max_weight_kg existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements'
    AND column_name = 'max_weight_kg'
    AND table_schema = 'public'
  ) INTO has_max_weight;

  -- Vérifier si available_kg existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements'
    AND column_name = 'available_kg'
    AND table_schema = 'public'
  ) INTO has_available_kg;

  RAISE NOTICE 'max_weight_kg exists: %, available_kg exists: %', has_max_weight, has_available_kg;

  -- Cas 1: max_weight_kg existe mais pas available_kg -> RENOMMER
  IF has_max_weight AND NOT has_available_kg THEN
    RAISE NOTICE 'Renaming max_weight_kg to available_kg';
    ALTER TABLE announcements RENAME COLUMN max_weight_kg TO available_kg;

  -- Cas 2: Les deux existent -> Supprimer max_weight_kg après avoir copié les données
  ELSIF has_max_weight AND has_available_kg THEN
    RAISE NOTICE 'Both columns exist, copying data and dropping max_weight_kg';
    UPDATE announcements
    SET available_kg = COALESCE(available_kg, max_weight_kg, 0);
    ALTER TABLE announcements DROP COLUMN max_weight_kg;

  -- Cas 3: Seulement available_kg existe -> Rien à faire
  ELSIF NOT has_max_weight AND has_available_kg THEN
    RAISE NOTICE 'Only available_kg exists, nothing to do';

  -- Cas 4: Aucune colonne n'existe -> Créer available_kg
  ELSE
    RAISE NOTICE 'Neither column exists, creating available_kg';
    ALTER TABLE announcements ADD COLUMN available_kg NUMERIC NOT NULL DEFAULT 0;
  END IF;

  -- S'assurer que available_kg a les bonnes contraintes
  IF has_available_kg OR has_max_weight THEN
    -- Mettre available_kg NOT NULL avec default
    ALTER TABLE announcements ALTER COLUMN available_kg SET DEFAULT 0;
    ALTER TABLE announcements ALTER COLUMN available_kg SET NOT NULL;

    -- Ajouter contrainte positive si elle n'existe pas
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'available_kg_positive'
      AND conrelid = 'announcements'::regclass
    ) THEN
      ALTER TABLE announcements ADD CONSTRAINT available_kg_positive CHECK (available_kg >= 0);
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN announcements.available_kg IS 'Poids maximal disponible pour le transport en kilogrammes';
