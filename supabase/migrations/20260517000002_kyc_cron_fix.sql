-- Reconfigurer le cron kyc-documents-cleanup-72h avec URL et secret en dur
-- (current_setting() nécessite Custom Configuration non disponible sur ce plan)

select cron.unschedule('kyc-documents-cleanup-72h');

select cron.schedule(
  'kyc-documents-cleanup-72h',
  '0 3 * * *',
  $$
    select net.http_post(
      url     := 'https://gosendbox.com/api/cron?job=kyc-documents-cleanup',
      headers := '{"Content-Type":"application/json","x-cron-secret":"9f5d202d46f36798b244e91e038ef25f4f254cda2d3f3b4ae7f1b031b8b22ba0"}'::jsonb,
      body    := '{}'::jsonb
    )
  $$
);
