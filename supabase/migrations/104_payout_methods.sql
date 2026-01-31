-- Add payout method fields for bank & mobile wallet

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_method TEXT,
  ADD COLUMN IF NOT EXISTS payout_status TEXT,
  ADD COLUMN IF NOT EXISTS wallet_operator TEXT,
  ADD COLUMN IF NOT EXISTS wallet_phone TEXT,
  ADD COLUMN IF NOT EXISTS wallet_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wallet_otp_code TEXT,
  ADD COLUMN IF NOT EXISTS wallet_otp_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_wallet_phone_idx
  ON public.profiles (wallet_phone);

ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS payout_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_transfer_id TEXT;

CREATE INDEX IF NOT EXISTS transfers_external_transfer_id_idx
  ON public.transfers (external_transfer_id);
