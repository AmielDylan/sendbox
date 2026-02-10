-- Replace storage cleanup trigger with Edge Function call

BEGIN;

CREATE EXTENSION IF NOT EXISTS pg_net;

DROP TRIGGER IF EXISTS cleanup_user_storage_trigger ON public.profiles;
DROP FUNCTION IF EXISTS public.cleanup_user_storage();

CREATE OR REPLACE FUNCTION public.cleanup_user_storage_via_edge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  url TEXT := current_setting('app.settings.cleanup_user_storage_url', true);
  secret TEXT := current_setting('app.settings.cleanup_user_storage_secret', true);
BEGIN
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

CREATE TRIGGER cleanup_user_storage_trigger
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_user_storage_via_edge();

COMMIT;
