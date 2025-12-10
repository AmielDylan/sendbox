-- Migration: KYC Storage Setup
-- Created: 2024-12-10
-- Description: Configuration du storage et des champs KYC dans profiles

-- Ajouter les colonnes KYC à la table profiles (si elles n'existent pas déjà)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS kyc_document_type TEXT CHECK (kyc_document_type IN ('passport', 'national_id')),
    ADD COLUMN IF NOT EXISTS kyc_document_number TEXT,
    ADD COLUMN IF NOT EXISTS kyc_document_front TEXT,
    ADD COLUMN IF NOT EXISTS kyc_document_back TEXT,
    ADD COLUMN IF NOT EXISTS kyc_birthday TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS kyc_nationality TEXT,
    ADD COLUMN IF NOT EXISTS kyc_address TEXT,
    ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS kyc_reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
  END IF;
END $$;

-- Mettre à jour le type de kyc_status si nécessaire
ALTER TABLE profiles
ALTER COLUMN kyc_status SET DEFAULT 'pending';

-- Créer le bucket de storage pour les documents KYC
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Les utilisateurs peuvent uploader leurs propres documents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload their own KYC documents'
  ) THEN
    CREATE POLICY "Users can upload their own KYC documents"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'kyc-documents' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- RLS Policy: Les utilisateurs peuvent lire leurs propres documents
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can read their own KYC documents'
  ) THEN
    CREATE POLICY "Users can read their own KYC documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'kyc-documents' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END $$;

-- RLS Policy: Les admins peuvent lire tous les documents KYC
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can read all KYC documents'
  ) THEN
    CREATE POLICY "Admins can read all KYC documents"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'kyc-documents'
      -- TODO: Ajouter vérification du rôle admin
      -- AND EXISTS (
      --   SELECT 1 FROM profiles
      --   WHERE user_id = auth.uid() AND role = 'admin'
      -- )
    );
  END IF;
END $$;

-- RLS Policy: Les utilisateurs peuvent supprimer leurs propres documents (avant review)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own KYC documents before review'
  ) THEN
    CREATE POLICY "Users can delete their own KYC documents before review"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'kyc-documents' AND
      (storage.foldername(name))[1] = auth.uid()::text
      -- TODO: Vérifier que kyc_status n'est pas 'approved'
    );
  END IF;
END $$;

-- Index pour améliorer les performances des requêtes KYC
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_submitted_at ON profiles(kyc_submitted_at);

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.kyc_document_type IS 'Type de document: passport ou national_id';
COMMENT ON COLUMN profiles.kyc_document_number IS 'Numéro du document d''identité';
COMMENT ON COLUMN profiles.kyc_document_front IS 'Chemin vers le document recto dans storage';
COMMENT ON COLUMN profiles.kyc_document_back IS 'Chemin vers le document verso dans storage (optionnel)';
COMMENT ON COLUMN profiles.kyc_birthday IS 'Date de naissance de l''utilisateur';
COMMENT ON COLUMN profiles.kyc_nationality IS 'Nationalité (code ISO)';
COMMENT ON COLUMN profiles.kyc_address IS 'Adresse complète de l''utilisateur';
COMMENT ON COLUMN profiles.kyc_submitted_at IS 'Date de soumission de la demande KYC';
COMMENT ON COLUMN profiles.kyc_reviewed_at IS 'Date de review par un admin';
COMMENT ON COLUMN profiles.kyc_rejection_reason IS 'Raison du rejet si KYC rejeté';

