-- Migration: Create bookings table with base columns
-- Created: 2024-12-19
-- Description: Créer la table bookings avec toutes les colonnes de base manquantes

-- Créer la table bookings si elle n'existe pas
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter les colonnes manquantes une par une
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS traveler_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Informations du colis
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS weight_kg NUMERIC CHECK (weight_kg > 0 AND weight_kg <= 30);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS description TEXT;

-- Statut et suivi
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (
  status IN ('pending', 'confirmed', 'in_transit', 'delivered', 'cancelled')
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Timestamps
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ajouter la contrainte UNIQUE sur qr_code si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'bookings_qr_code_key' 
    AND conrelid = 'bookings'::regclass
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_qr_code_key UNIQUE (qr_code);
  END IF;
END $$;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS bookings_sender_id_idx ON bookings(sender_id);
CREATE INDEX IF NOT EXISTS bookings_traveler_id_idx ON bookings(traveler_id);
CREATE INDEX IF NOT EXISTS bookings_announcement_id_idx ON bookings(announcement_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bookings_updated_at_trigger ON bookings;
CREATE TRIGGER update_bookings_updated_at_trigger
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_bookings_updated_at();

-- Commentaires
COMMENT ON TABLE bookings IS 'Réservations de transport de colis';
COMMENT ON COLUMN bookings.weight_kg IS 'Poids du colis en kilogrammes (1-30 kg)';
COMMENT ON COLUMN bookings.status IS 'Statut de la réservation';
COMMENT ON COLUMN bookings.qr_code IS 'Code QR unique pour le suivi';

