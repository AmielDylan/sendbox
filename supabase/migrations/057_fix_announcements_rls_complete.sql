-- Fix complet des politiques RLS pour announcements
-- Supprime TOUTES les politiques existantes et recrée des politiques simples sans récursion

-- Supprimer TOUTES les anciennes politiques
DROP POLICY IF EXISTS "Users can delete their own announcements" ON announcements;
DROP POLICY IF EXISTS "Users can update their own announcements" ON announcements;
DROP POLICY IF EXISTS "Admins can update any announcement" ON announcements;
DROP POLICY IF EXISTS "Admins can delete any announcement" ON announcements;

-- Créer des politiques simples pour UPDATE
CREATE POLICY "Users can update their own announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (traveler_id = auth.uid())
  WITH CHECK (traveler_id = auth.uid());

-- Créer des politiques simples pour DELETE
CREATE POLICY "Users can delete their own announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (traveler_id = auth.uid());

-- Ajouter les politiques admin (sans récursion)
CREATE POLICY "Admins can update any announcement"
  ON announcements FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete any announcement"
  ON announcements FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
