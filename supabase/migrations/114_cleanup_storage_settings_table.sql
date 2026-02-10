-- Store cleanup settings in a table (avoids ALTER DATABASE permissions)

BEGIN;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (key, value)
VALUES
  (
    'cleanup_user_storage_url',
    COALESCE(current_setting('app.settings.cleanup_user_storage_url', true), '')
  ),
  (
    'cleanup_user_storage_secret',
    COALESCE(current_setting('app.settings.cleanup_user_storage_secret', true), '')
  )
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.cleanup_user_storage_via_edge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  url TEXT;
  secret TEXT;
BEGIN
  SELECT value INTO url FROM public.app_settings WHERE key = 'cleanup_user_storage_url';
  SELECT value INTO secret FROM public.app_settings WHERE key = 'cleanup_user_storage_secret';

  IF url IS NULL OR url = '' THEN
    url := current_setting('app.settings.cleanup_user_storage_url', true);
  END IF;

  IF secret IS NULL OR secret = '' THEN
    secret := current_setting('app.settings.cleanup_user_storage_secret', true);
  END IF;

  IF url IS NULL OR url = '' THEN
    RAISE WARNING 'cleanup_user_storage_via_edge: missing cleanup_user_storage_url';
    RETURN OLD;
  END IF;

  PERFORM net.http_post(
    url := url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cleanup-secret', COALESCE(secret, '')
    ),
    body := jsonb_build_object('user_id', OLD.id)
  );

  RETURN OLD;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'cleanup_user_storage_via_edge failed: %', SQLERRM;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_user_storage_trigger ON public.profiles;
CREATE TRIGGER cleanup_user_storage_trigger
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_storage_via_edge();

COMMIT;
