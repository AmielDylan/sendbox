-- Migration: Ajouter la colonne available_kg aux annonces
-- Created: 2024-12-26
-- Description: La migration 033 a supprimé max_weight_kg en supposant qu'available_kg existait, mais ce n'était pas le cas

-- Ajouter la colonne available_kg si elle n'existe pas
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS available_kg NUMERIC;

-- Mettre available_kg égal à max_weight_kg si elle existe, sinon 0
-- (au cas où max_weight_kg existe encore dans certains environnements)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'announcements' AND column_name = 'max_weight_kg'
  ) THEN
    UPDATE announcements SET available_kg = COALESCE(max_weight_kg, 0) WHERE available_kg IS NULL;
  END IF;
END $$;

-- S'assurer que available_kg n'est jamais NULL
UPDATE announcements SET available_kg = 0 WHERE available_kg IS NULL;

-- Ajouter la contrainte NOT NULL
ALTER TABLE announcements
ALTER COLUMN available_kg SET NOT NULL,
ALTER COLUMN available_kg SET DEFAULT 0;

-- Ajouter une contrainte de validation
ALTER TABLE announcements
ADD CONSTRAINT available_kg_positive CHECK (available_kg >= 0);

COMMENT ON COLUMN announcements.available_kg IS 'Poids maximal disponible pour le transport en kilogrammes';
