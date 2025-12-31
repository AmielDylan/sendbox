-- Migration: Supprimer la contrainte future_departure
-- Date: 2024-12-26
-- Description: Permet la modification des annonces avec des dates passées

-- Supprimer la contrainte si elle existe
ALTER TABLE announcements
DROP CONSTRAINT IF EXISTS future_departure;

-- Note: Pour les nouvelles annonces, la validation se fait côté application
-- via le schéma Zod qui vérifie que la date est future lors de la création
