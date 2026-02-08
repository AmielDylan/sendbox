-- Add payout error tracking fields for Stripe Connect polling guards

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_error_code text,
  ADD COLUMN IF NOT EXISTS payout_error_message text,
  ADD COLUMN IF NOT EXISTS payout_error_at timestamptz;
