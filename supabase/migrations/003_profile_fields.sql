-- Migration: Profile Fields
-- Created: 2024-12-10
-- Description: Ajout des champs address et bio à la table profiles

-- Ajouter les colonnes si elles n'existent pas déjà
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 500);

-- Créer le bucket de storage pour les avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public pour permettre l'affichage des avatars
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Les utilisateurs peuvent uploader leurs propres avatars
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Les utilisateurs peuvent mettre à jour leurs propres avatars
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Les utilisateurs peuvent supprimer leurs propres avatars
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS Policy: Tout le monde peut lire les avatars (bucket public)
DROP POLICY IF EXISTS "Avatars are publicly readable" ON storage.objects;
CREATE POLICY "Avatars are publicly readable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address) WHERE address IS NOT NULL;

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.address IS 'Adresse complète de l''utilisateur';
COMMENT ON COLUMN profiles.bio IS 'Biographie de l''utilisateur (maximum 500 caractères)';

