-- Migration: Force le rechargement du schéma PostgREST (méthode alternative)
-- Created: 2026-01-01
-- Description: Crée et supprime une colonne temporaire pour forcer PostgREST à recharger

-- Ajouter une colonne temporaire puis la supprimer
-- Cela force PostgreSQL à invalider le cache et PostgREST à recharger
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS _temp_force_reload BOOLEAN DEFAULT FALSE;
ALTER TABLE announcements DROP COLUMN IF EXISTS _temp_force_reload;

-- Vérifier que available_kg existe bien
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'announcements'
      AND column_name = 'available_kg'
  ) THEN
    RAISE EXCEPTION 'ERREUR CRITIQUE: La colonne available_kg n''existe pas dans announcements';
  END IF;
END $$;

-- Commentaire pour tracer
COMMENT ON COLUMN announcements.available_kg IS 'Poids disponible en kg - vérifié et forcé le 2026-01-01';
