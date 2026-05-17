-- Planification du cron de suppression des fichiers KYC > 72h
-- Requiert pg_cron + pg_net activés sur le projet (fait via le dashboard Supabase)
-- Les variables app.url et app.cron_secret doivent être définies dans
-- Dashboard → Settings → Database → Custom Configuration :
--   app.url = https://your-app.vercel.app
--   app.cron_secret = <valeur de CRON_SECRET dans .env>

select cron.schedule(
  'kyc-documents-cleanup-72h',
  '0 3 * * *',
  $$
    select net.http_post(
      url     := current_setting('app.url') || '/api/cron?job=kyc-documents-cleanup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', current_setting('app.cron_secret')
      ),
      body    := '{}'::jsonb
    )
  $$
);
