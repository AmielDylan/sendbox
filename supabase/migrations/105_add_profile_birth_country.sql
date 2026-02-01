-- Add profile birthday and country for analytics

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN public.profiles.birthday IS 'Date de naissance (profil)';
COMMENT ON COLUMN public.profiles.country IS 'Pays du profil (ISO)';
