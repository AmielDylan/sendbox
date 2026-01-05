-- Correction de la politique DELETE pour announcements
-- Problème: infinite recursion détectée

-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Users can delete their own announcements" ON announcements;

-- Recréer avec une politique simplifiée sans récursion
CREATE POLICY "Users can delete their own announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    traveler_id = auth.uid()
  );

-- Également vérifier et corriger la politique UPDATE
DROP POLICY IF EXISTS "Users can update their own announcements" ON announcements;

CREATE POLICY "Users can update their own announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    traveler_id = auth.uid()
  );
