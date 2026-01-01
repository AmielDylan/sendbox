-- Migration: Permettre la lecture publique des annonces actives (non authentifié aussi)
-- Created: 2026-01-01
-- Description: Remplace la policy qui nécessitait l'authentification par une policy publique

-- Supprimer l'ancienne policy qui nécessitait l'authentification
DROP POLICY IF EXISTS "Anyone can view active announcements" ON announcements;

-- Créer une nouvelle policy qui permet l'accès public
CREATE POLICY "Public can view active announcements"
ON announcements FOR SELECT
TO public
USING (status IN ('active', 'published', 'partially_booked'));

COMMENT ON POLICY "Public can view active announcements" ON announcements IS 'Tout le monde (authentifié ou non) peut voir les annonces actives pour la recherche publique';
