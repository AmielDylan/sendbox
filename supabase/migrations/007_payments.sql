-- Migration: Système de paiement Stripe
-- Created: 2024-12-10
-- Description: Ajout des champs de paiement et table transactions

-- Ajouter les colonnes de paiement aux bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS total_price NUMERIC,
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC,
ADD COLUMN IF NOT EXISTS insurance_premium NUMERIC;

-- Créer la table transactions si elle n'existe pas
-- Note: La migration 001 a déjà créé cette table avec sender_id et traveler_id
-- Cette migration ajoute des champs supplémentaires si nécessaire
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'eur';

-- Index pour les requêtes fréquentes (avec vérification de l'existence)
CREATE INDEX IF NOT EXISTS transactions_booking_id_idx ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS transactions_sender_id_idx ON transactions(sender_id);
CREATE INDEX IF NOT EXISTS transactions_traveler_id_idx ON transactions(traveler_id);
-- Index sur status (si la colonne existe)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'transactions' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
  END IF;
END $$;;
CREATE INDEX IF NOT EXISTS transactions_stripe_payment_intent_id_idx ON transactions(stripe_payment_intent_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies pour transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Note: Les RLS policies pour transactions sont déjà définies dans migration 001
-- Cette migration ne les réc rée pas pour éviter les conflits

-- Commentaires
COMMENT ON COLUMN bookings.payment_intent_id IS 'ID du Payment Intent Stripe';
COMMENT ON COLUMN bookings.paid_at IS 'Date de paiement confirmé';
COMMENT ON COLUMN bookings.total_price IS 'Prix total du transport (sans commission ni assurance)';
COMMENT ON COLUMN bookings.commission_amount IS 'Montant de la commission Sendbox';
COMMENT ON COLUMN bookings.insurance_premium IS 'Prime d''assurance si souscrite';
COMMENT ON TABLE transactions IS 'Historique de toutes les transactions financières';

