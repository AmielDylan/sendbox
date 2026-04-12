-- Migration: Travel Proof
-- Created: 2026-04-02
-- Description: Preuve de voyage (billet anonymisé) par annonce

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS travel_proof_url TEXT,
  ADD COLUMN IF NOT EXISTS travel_proof_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS travel_proof_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN public.announcements.travel_proof_url IS
  'URL du billet de voyage (informations sensibles anonymisées avant upload)';
COMMENT ON COLUMN public.announcements.travel_proof_verified IS
  'Preuve vérifiée manuellement par un admin (pour Phase 3+)';
COMMENT ON COLUMN public.announcements.travel_proof_verified_at IS
  'Date de vérification de la preuve de voyage';
