-- Migration: Permettre la lecture publique des annonces actives
-- Created: 2024-12-26
-- Description: Permet aux utilisateurs authentifiés de lire les annonces actives pour pouvoir les réserver

-- Ajouter une politique pour permettre la lecture des annonces actives par tout le monde
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;

CREATE POLICY "Anyone can view active announcements"
ON announcements FOR SELECT
TO authenticated
USING (status = 'active');

COMMENT ON POLICY "Anyone can view active announcements" ON announcements IS 'Les utilisateurs authentifiés peuvent voir toutes les annonces actives pour pouvoir les réserver';
