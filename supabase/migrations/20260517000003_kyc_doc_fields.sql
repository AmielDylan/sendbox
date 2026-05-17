-- Ajout métadonnées document sur kyc_reviews
ALTER TABLE kyc_reviews
  ADD COLUMN IF NOT EXISTS doc_type       TEXT,
  ADD COLUMN IF NOT EXISTS doc_country    TEXT,
  ADD COLUMN IF NOT EXISTS custom_country TEXT,
  ADD COLUMN IF NOT EXISTS admin_notes    TEXT;

-- Table des pays suggérés et approuvés par l'admin
CREATE TABLE IF NOT EXISTS kyc_approved_countries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code         TEXT UNIQUE NOT NULL,
  label        TEXT NOT NULL,
  suggested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE kyc_approved_countries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_approved_countries"
  ON kyc_approved_countries FOR SELECT USING (true);
