-- Migration: Champs supplémentaires pour les bookings
-- Created: 2024-12-10
-- Description: Ajout des champs package_value, package_photos et insurance_opted

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS package_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS package_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS insurance_opted BOOLEAN DEFAULT false;

-- Créer le bucket de storage pour les photos de colis
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'package-photos',
  'package-photos',
  false, -- Privé pour protéger les photos
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Les utilisateurs peuvent uploader leurs propres photos de colis
CREATE POLICY "Users can upload their own package photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'package-photos' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM bookings WHERE sender_id = auth.uid()
  )
);

-- RLS Policy: Les utilisateurs peuvent lire leurs propres photos ou celles de leurs bookings
CREATE POLICY "Users can read package photos for their bookings"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'package-photos' AND
  (
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM bookings WHERE sender_id = auth.uid()
    ) OR
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM bookings WHERE traveler_id = auth.uid()
    )
  )
);

-- Commentaires
COMMENT ON COLUMN bookings.package_value IS 'Valeur déclarée du colis en EUR';
COMMENT ON COLUMN bookings.package_photos IS 'URLs des photos du colis dans Supabase Storage';
COMMENT ON COLUMN bookings.insurance_opted IS 'Indique si l''expéditeur a souscrit une assurance';

