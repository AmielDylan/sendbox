-- Fix: migration 115 réintroduisait COALESCE(phone, '') au lieu de NULLIF(phone, '')
-- ce qui causait une violation de la contrainte phone_format lors de la création
-- d'utilisateurs sans numéro de téléphone (ex: création admin ou E2E tests).

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
    subscription_status,
    trial_ends_at,
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
    'trialing',
    now() + interval '14 days',
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
    trial_ends_at = COALESCE(profiles.trial_ends_at, EXCLUDED.trial_ends_at),
    subscription_status = COALESCE(profiles.subscription_status, EXCLUDED.subscription_status),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Crée le profil à l''inscription et initialise le trial de 14 jours. phone: NULLIF pour éviter violation phone_format.';
