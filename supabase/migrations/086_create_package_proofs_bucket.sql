-- Migration: Bucket Storage pour preuves de dépôt/livraison
-- Created: 2026-01-04
-- Description: Création du bucket package-proofs et politiques RLS associées

-- Créer le bucket pour les preuves (photos/signatures)
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-proofs', 'package-proofs', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can upload package proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view package proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update package proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete package proofs" ON storage.objects;

-- Politique INSERT: autoriser si l'utilisateur est expéditeur ou voyageur du booking
CREATE POLICY "Users can upload package proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'package-proofs' AND
  (storage.foldername(name))[1] IN ('deposits', 'deliveries') AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[2]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);

-- Politique SELECT: lecture pour expéditeur ou voyageur du booking
CREATE POLICY "Users can view package proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'package-proofs' AND
  (storage.foldername(name))[1] IN ('deposits', 'deliveries') AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[2]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);

-- Politique UPDATE: autoriser les mises à jour (si besoin)
CREATE POLICY "Users can update package proofs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'package-proofs' AND
  (storage.foldername(name))[1] IN ('deposits', 'deliveries') AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[2]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
)
WITH CHECK (
  bucket_id = 'package-proofs' AND
  (storage.foldername(name))[1] IN ('deposits', 'deliveries') AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[2]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);

-- Politique DELETE: autoriser suppression pour expéditeur ou voyageur
CREATE POLICY "Users can delete package proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'package-proofs' AND
  (storage.foldername(name))[1] IN ('deposits', 'deliveries') AND
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id::text = (storage.foldername(name))[2]
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);
