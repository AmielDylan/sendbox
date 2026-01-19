-- Mise à jour de l'avatar par défaut (Dicebear 9.x thumbs)

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

-- Remplacer les anciens avatars Dicebear 7.x ou vides
UPDATE public.profiles
SET avatar_url = 'https://api.dicebear.com/9.x/thumbs/svg?seed=' || id
WHERE avatar_url IS NULL
  OR avatar_url = ''
  OR avatar_url LIKE 'https://api.dicebear.com/7.x/avataaars/svg?seed=%';

COMMENT ON FUNCTION public.handle_new_user()
IS 'Copie automatiquement les données de auth.users vers public.profiles lors de la création d''un compte';
