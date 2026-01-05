-- Migration: Fix RLS pour contracts storage bucket
-- Date: 2 Janvier 2026
-- Description: Correction des politiques RLS pour permettre l'upload des contrats PDF
--              Les fichiers sont stockés dans bookingId/filename.pdf

-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Users can upload contracts for their bookings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view contracts for their bookings" ON storage.objects;

-- Politique INSERT: Permet l'upload si l'utilisateur est sender ou traveler du booking
CREATE POLICY "Users can upload contracts for their bookings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[1]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);

-- Politique SELECT: Permet la lecture si l'utilisateur est sender ou traveler du booking
CREATE POLICY "Users can view contracts for their bookings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[1]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);

-- Politique UPDATE: Permet la mise à jour (upsert) si l'utilisateur est sender ou traveler
CREATE POLICY "Users can update contracts for their bookings"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[1]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[1]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);

-- Politique DELETE: Optionnel - permettre la suppression (pour cleanup)
CREATE POLICY "Users can delete contracts for their bookings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts' AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[1]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);
