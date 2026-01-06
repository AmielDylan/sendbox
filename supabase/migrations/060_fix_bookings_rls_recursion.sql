-- Fix récursion infinie entre announcements et bookings RLS
-- Problème: La politique "Announcement owners can view related bookings" fait un SELECT sur announcements
-- ce qui peut créer une récursion lorsque announcements fait un SELECT sur bookings
-- Solution: Fonction SECURITY DEFINER pour vérifier ownership sans déclencher RLS

-- Créer une fonction sécurisée pour vérifier si un announcement appartient à l'utilisateur
-- SECURITY DEFINER permet d'exécuter avec les privilèges du créateur (bypass RLS)
CREATE OR REPLACE FUNCTION owns_announcement(announcement_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM announcements
    WHERE id = announcement_id_param
    AND traveler_id = auth.uid()
  );
$$;

-- Ajouter un commentaire pour la documentation
COMMENT ON FUNCTION owns_announcement(UUID) IS
  'Vérifie si l''utilisateur actuel possède l''annonce spécifiée. '
  'Utilise SECURITY DEFINER pour éviter les récursions RLS.';

-- Recréer la politique pour les propriétaires d'annonces sans risque de récursion
DROP POLICY IF EXISTS "Announcement owners can view related bookings" ON bookings;

CREATE POLICY "Announcement owners can view related bookings"
ON bookings FOR SELECT
TO authenticated
USING (owns_announcement(announcement_id));

COMMENT ON POLICY "Announcement owners can view related bookings" ON bookings
IS 'Les propriétaires d''annonces peuvent voir les bookings liés à leurs annonces (sans récursion RLS)';
