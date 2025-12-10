-- Migration: Système de traçabilité avec QR codes
-- Created: 2024-12-10
-- Description: Génération automatique de QR codes et champs de traçabilité

-- Fonction pour générer un QR code unique (format: XXXX-XXXX-XXXX)
CREATE OR REPLACE FUNCTION generate_booking_qr_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclut 0, O, I, 1 pour éviter confusion
  qr_code TEXT := '';
  i INTEGER;
  segment TEXT;
BEGIN
  -- Générer 3 segments de 4 caractères
  FOR i IN 1..3 LOOP
    segment := '';
    FOR j IN 1..4 LOOP
      segment := segment || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    
    IF i = 1 THEN
      qr_code := segment;
    ELSE
      qr_code := qr_code || '-' || segment;
    END IF;
  END LOOP;
  
  -- Vérifier l'unicité (très peu probable mais sécurité)
  WHILE EXISTS (SELECT 1 FROM bookings WHERE qr_code = qr_code) LOOP
    -- Régénérer si collision
    qr_code := '';
    FOR i IN 1..3 LOOP
      segment := '';
      FOR j IN 1..4 LOOP
        segment := segment || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;
      
      IF i = 1 THEN
        qr_code := segment;
      ELSE
        qr_code := qr_code || '-' || segment;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN qr_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement le QR code lors de la création d'un booking
CREATE OR REPLACE FUNCTION set_booking_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := generate_booking_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_qr_code_on_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_qr_code();

-- Ajouter les colonnes de traçabilité aux bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS deposited_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deposit_photo_url TEXT,
ADD COLUMN IF NOT EXISTS deposit_signature_url TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_photo_url TEXT,
ADD COLUMN IF NOT EXISTS delivery_signature_url TEXT,
ADD COLUMN IF NOT EXISTS deposit_location_lat NUMERIC,
ADD COLUMN IF NOT EXISTS deposit_location_lng NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_location_lat NUMERIC,
ADD COLUMN IF NOT EXISTS delivery_location_lng NUMERIC;

-- Index pour recherche par QR code
CREATE INDEX IF NOT EXISTS bookings_qr_code_idx ON bookings(qr_code);

-- Table pour logs de scans (audit)
CREATE TABLE IF NOT EXISTS qr_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  scan_type TEXT NOT NULL CHECK (scan_type IN ('deposit', 'delivery')),
  scanned_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,
  location_lat NUMERIC,
  location_lng NUMERIC,
  photo_url TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS qr_scan_logs_booking_id_idx ON qr_scan_logs(booking_id);
CREATE INDEX IF NOT EXISTS qr_scan_logs_created_at_idx ON qr_scan_logs(created_at DESC);

-- RLS Policies pour scan logs
ALTER TABLE qr_scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scan logs for their bookings"
ON qr_scan_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id = qr_scan_logs.booking_id
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);

CREATE POLICY "Users can create scan logs for their bookings"
ON qr_scan_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE id = qr_scan_logs.booking_id
    AND (sender_id = auth.uid() OR traveler_id = auth.uid())
  )
);

-- Commentaires
COMMENT ON COLUMN bookings.qr_code IS 'Code QR unique pour la traçabilité (format: XXXX-XXXX-XXXX)';
COMMENT ON COLUMN bookings.deposited_at IS 'Date et heure du dépôt du colis';
COMMENT ON COLUMN bookings.delivered_at IS 'Date et heure de la livraison du colis';
COMMENT ON TABLE qr_scan_logs IS 'Logs d''audit pour tous les scans QR code';

