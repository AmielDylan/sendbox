-- Allow signup without phone (phone optional)

ALTER TABLE public.profiles
  ALTER COLUMN phone DROP NOT NULL;

UPDATE public.profiles
SET phone = NULL
WHERE phone = '';

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
    NULLIF(NEW.raw_user_meta_data->>'phone', ''),
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

-- Backfill missing profiles for existing auth users (ensure NULL phone)
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
  NULLIF(u.raw_user_meta_data->>'phone', ''),
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
