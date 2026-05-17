-- KYC v1 — upload documents + extraction MRZ + validation admin
-- Remplacement du flow textuel Stripe par un flow document/selfie natif

-- 1. Colonnes supplémentaires sur profiles
alter table profiles
  add column if not exists kyc_document_front  text,
  add column if not exists kyc_document_back   text,
  add column if not exists verified_at         timestamptz,
  add column if not exists verified_name       text;

-- 2. Table des dossiers KYC (résultats MRZ + consentement)
create table if not exists kyc_reviews (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  consent_at      timestamptz,
  mrz_valid       boolean,
  mrz_name        text,
  mrz_nationality text,
  mrz_birth_date  text,
  mrz_expiry      text,
  mrz_expired     boolean,
  mrz_raw         text,
  ocr_confidence  float,
  status          text not null default 'PENDING',
  admin_id        uuid references profiles(id),
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists kyc_reviews_user_id_idx on kyc_reviews(user_id);
create index if not exists kyc_reviews_status_idx  on kyc_reviews(status);

-- RLS : aucune policy user = RLS bloque tout accès authentifié ordinaire.
-- Le service role (createAdminClient) bypass RLS automatiquement.
alter table kyc_reviews enable row level security;

-- 3. Bucket kyc-documents — service-role only
-- Supprimer toutes les policies user existantes
drop policy if exists "Users can upload their own KYC documents" on storage.objects;
drop policy if exists "Users can read their own KYC documents"   on storage.objects;
drop policy if exists "Users can delete their own KYC documents before review" on storage.objects;
drop policy if exists "Admins can read all KYC documents"        on storage.objects;
-- Sans aucune policy, la RLS sur storage.objects bloque tout accès anon/authenticated.
-- createAdminClient() (service_role key) bypasse la RLS → accès total au bucket.

-- 4. pg_cron — suppression automatique des fichiers KYC > 72h
-- À activer manuellement via le dashboard Supabase (Extensions → pg_cron + pg_net)
-- puis exécuter dans l'éditeur SQL :
--
-- select cron.schedule(
--   'kyc-documents-cleanup-72h',
--   '0 3 * * *',
--   $$
--     select net.http_post(
--       url     := current_setting('app.url') || '/api/cron?job=kyc-documents-cleanup',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-secret', current_setting('app.cron_secret')
--       ),
--       body    := '{}'::jsonb
--     )
--   $$
-- );
