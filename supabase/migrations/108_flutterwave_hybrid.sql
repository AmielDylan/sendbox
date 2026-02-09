-- Add Flutterwave hybrid payout fields

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_provider TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_subaccount_id TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_recipient_id TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_recipient_type TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_recipient_currency TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_bank_code TEXT,
  ADD COLUMN IF NOT EXISTS flutterwave_bank_account_name TEXT;

CREATE INDEX IF NOT EXISTS profiles_flutterwave_recipient_id_idx
  ON public.profiles (flutterwave_recipient_id);
