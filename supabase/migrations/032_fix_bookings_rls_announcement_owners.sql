-- Migration: Add RLS policy for announcement owners to view bookings
-- Created: 2024-12-24
-- Description: Permet aux propriétaires d'annonces de voir les bookings liés à leurs annonces

-- Ajouter une politique qui permet aux propriétaires d'annonces de voir les bookings associés
-- C'est nécessaire pour la suppression/édition d'annonces (vérification des bookings actifs)

DROP POLICY IF EXISTS "Announcement owners can view related bookings" ON bookings;

CREATE POLICY "Announcement owners can view related bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  announcement_id IN (
    SELECT id FROM announcements WHERE traveler_id = auth.uid()
  )
);

COMMENT ON POLICY "Announcement owners can view related bookings" ON bookings IS 'Les propriétaires d''annonces peuvent voir les bookings liés à leurs annonces';
