-- Synchroniser les anciens dossiers KYC qui avaient verification_status comme source
-- principale sans kyc_status equivalent.

UPDATE profiles
SET kyc_status = 'pending'
WHERE verification_status = 'pending'
  AND kyc_status IS DISTINCT FROM 'pending';

UPDATE profiles
SET kyc_status = 'approved'
WHERE verification_status = 'verified'
  AND kyc_status IS DISTINCT FROM 'approved';

UPDATE profiles
SET kyc_status = 'rejected'
WHERE verification_status = 'rejected'
  AND kyc_status IS DISTINCT FROM 'rejected';
