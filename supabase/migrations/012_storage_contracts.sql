-- Migration: Bucket Storage pour contrats PDF
-- Created: 2024-12-10
-- Description: Création du bucket pour stocker les PDF de contrats et preuves

-- Créer le bucket pour les contrats PDF
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies pour contracts
DROP POLICY IF EXISTS "Users can upload contracts for their bookings" ON storage.objects;
CREATE POLICY "Users can upload contracts for their bookings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view contracts for their bookings" ON storage.objects;
CREATE POLICY "Users can view contracts for their bookings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM bookings
      WHERE id::text = (storage.foldername(name))[1]
      AND (sender_id = auth.uid() OR traveler_id = auth.uid())
    )
  )
);

-- Commentaires
-- Note: storage.buckets est une table système, on ne peut pas ajouter de commentaire

