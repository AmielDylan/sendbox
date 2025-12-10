-- Migration: Buckets Storage pour signatures et photos de colis
-- Created: 2024-12-10
-- Description: Création des buckets pour signatures et photos de traçabilité

-- Créer le bucket pour les signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies pour signatures
DROP POLICY IF EXISTS "Users can upload signatures for their bookings" ON storage.objects;
CREATE POLICY "Users can upload signatures for their bookings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view signatures for their bookings" ON storage.objects;
CREATE POLICY "Users can view signatures for their bookings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM bookings
      WHERE (deposit_signature_url LIKE '%' || name OR delivery_signature_url LIKE '%' || name)
      AND (sender_id = auth.uid() OR traveler_id = auth.uid())
    )
  )
);

-- Le bucket package-photos existe déjà (créé dans migration précédente)
-- Ajouter RLS policies si nécessaire
DROP POLICY IF EXISTS "Users can upload package photos for their bookings" ON storage.objects;
CREATE POLICY "Users can upload package photos for their bookings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'package-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view package photos for their bookings" ON storage.objects;
CREATE POLICY "Users can view package photos for their bookings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'package-photos' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM bookings
      WHERE (
        deposit_photo_url LIKE '%' || name OR
        delivery_photo_url LIKE '%' || name OR
        package_photos @> ARRAY[name]
      )
      AND (sender_id = auth.uid() OR traveler_id = auth.uid())
    )
  )
);

