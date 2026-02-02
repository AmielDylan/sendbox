-- Add profile city and postal code for Stripe onboarding reuse

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

COMMENT ON COLUMN public.profiles.city IS 'Ville du profil (adresse)';
COMMENT ON COLUMN public.profiles.postal_code IS 'Code postal du profil';
