-- Drop unused legacy profile/KYC columns
-- This is safe to run multiple times thanks to IF EXISTS

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS kyc_document_url,
  DROP COLUMN IF EXISTS kyc_verified_at,
  DROP COLUMN IF EXISTS kyc_document_number,
  DROP COLUMN IF EXISTS kyc_document_front,
  DROP COLUMN IF EXISTS kyc_document_back,
  DROP COLUMN IF EXISTS kyc_birthday,
  DROP COLUMN IF EXISTS kyc_address,
  DROP COLUMN IF EXISTS kyc_approved_at,
  DROP COLUMN IF EXISTS kyc_rejected_reason,
  DROP COLUMN IF EXISTS document_type,
  DROP COLUMN IF EXISTS document_number,
  DROP COLUMN IF EXISTS document_front_url,
  DROP COLUMN IF EXISTS document_back_url,
  DROP COLUMN IF EXISTS birthday,
  DROP COLUMN IF EXISTS nationality,
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS last_active_at,
  DROP COLUMN IF EXISTS total_services,
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS stripe_account_id;
