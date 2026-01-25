-- Ensure profiles are created from auth.users and default KYC is incomplete

-- Set default KYC status for new profiles
ALTER TABLE public.profiles
ALTER COLUMN kyc_status SET DEFAULT 'incomplete';

-- Recreate trigger function to ensure profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    firstname,
    lastname,
    phone,
    avatar_url,
    kyc_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'firstname', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastname', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      'https://api.dicebear.com/9.x/thumbs/svg?seed=' || NEW.id
    ),
    'incomplete',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    firstname = COALESCE(EXCLUDED.firstname, profiles.firstname),
    lastname = COALESCE(EXCLUDED.lastname, profiles.lastname),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profiles for existing auth users
INSERT INTO public.profiles (
  id,
  email,
  firstname,
  lastname,
  phone,
  avatar_url,
  kyc_status,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'firstname', ''),
  COALESCE(u.raw_user_meta_data->>'lastname', ''),
  COALESCE(u.raw_user_meta_data->>'phone', ''),
  COALESCE(
    u.raw_user_meta_data->>'avatar_url',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=' || u.id
  ),
  'incomplete',
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- Fix legacy pending defaults without a submitted KYC
UPDATE public.profiles
SET kyc_status = 'incomplete'
WHERE kyc_status = 'pending'
  AND kyc_submitted_at IS NULL;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Copie automatiquement les données de auth.users vers public.profiles lors de la création d''un compte';
