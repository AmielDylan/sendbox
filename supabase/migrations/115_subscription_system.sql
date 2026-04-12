-- Migration: Subscription System
-- Created: 2026-04-02
-- Description: Abonnement voyageur pro 4,99 €/mois avec trial 14 jours

-- Enum subscription_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM (
      'trialing',   -- Dans la période d'essai (14 jours)
      'active',     -- Abonné et à jour
      'past_due',   -- Paiement échoué, grace period
      'canceled',   -- Annulé (subscription_expires_at indique la fin d'accès)
      'inactive'    -- Jamais abonné ou trial expiré sans souscription
    );
  END IF;
END $$;

-- Colonnes subscription dans profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status_enum NOT NULL DEFAULT 'trialing',
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index uniques (WHERE pour ignorer les NULLs)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx
  ON public.profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_subscription_id_idx
  ON public.profiles(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Backfill trial pour les utilisateurs existants sans trial_ends_at
-- (utilisateurs déjà inscrits avant cette migration → trial rétroactif de 14j à partir de now)
UPDATE public.profiles
SET trial_ends_at = now() + interval '14 days'
WHERE trial_ends_at IS NULL;

-- Mettre à jour le trigger handle_new_user pour initialiser le trial sur inscription
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
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
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
    -- Ne pas écraser trial_ends_at si déjà défini
    trial_ends_at = COALESCE(profiles.trial_ends_at, EXCLUDED.trial_ends_at),
    subscription_status = COALESCE(profiles.subscription_status, EXCLUDED.subscription_status),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'Crée le profil à l''inscription et initialise le trial de 14 jours';
