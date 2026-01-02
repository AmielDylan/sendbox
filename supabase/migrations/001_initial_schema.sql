-- Migration: Initial Schema
-- Created: 2024-12-26
-- Description: Création du schéma initial complet Sendbox

-- =================================================================
-- EXTENSIONS
-- =================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =================================================================
-- ENUMS
-- =================================================================

CREATE TYPE kyc_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE announcement_status_enum AS ENUM ('draft', 'published', 'active', 'partially_booked', 'fully_booked', 'in_transit', 'completed', 'cancelled');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'accepted', 'refused', 'paid', 'deposited', 'in_transit', 'delivered', 'disputed', 'cancelled');
CREATE TYPE transaction_type_enum AS ENUM ('booking_payment', 'traveler_payout', 'refund', 'platform_fee');
CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- =================================================================
-- TABLES
-- =================================================================

-- Table: profiles (lié à auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  address TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  avatar_url TEXT,
  kyc_status kyc_status_enum NOT NULL DEFAULT 'pending',
  kyc_document_url TEXT,
  kyc_submitted_at TIMESTAMPTZ,
  kyc_verified_at TIMESTAMPTZ,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: announcements (annonces de voyage)
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  departure_country TEXT NOT NULL,
  departure_city TEXT NOT NULL,
  arrival_country TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  departure_date TIMESTAMPTZ NOT NULL,
  arrival_date TIMESTAMPTZ NOT NULL,
  available_kg NUMERIC NOT NULL DEFAULT 0 CHECK (available_kg >= 0),
  reserved_kg NUMERIC DEFAULT 0 CHECK (reserved_kg >= 0),
  price_per_kg NUMERIC NOT NULL CHECK (price_per_kg >= 0),
  description TEXT,
  status announcement_status_enum NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: bookings (réservations de colis)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Détails du colis
  package_description TEXT NOT NULL,
  kilos_requested NUMERIC NOT NULL CHECK (kilos_requested > 0),
  package_value NUMERIC NOT NULL DEFAULT 0 CHECK (package_value >= 0),
  insurance_opted BOOLEAN NOT NULL DEFAULT false,

  -- Informations de livraison
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  delivery_address TEXT NOT NULL,

  -- Prix et paiement
  total_price NUMERIC NOT NULL CHECK (total_price >= 0),
  platform_fee NUMERIC NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  insurance_fee NUMERIC DEFAULT 0 CHECK (insurance_fee >= 0),

  -- Statut et workflow
  status booking_status_enum NOT NULL DEFAULT 'pending',

  -- QR Codes et preuves
  qr_code TEXT,
  deposit_proof_url TEXT,
  deposit_signature_url TEXT,
  deposited_at TIMESTAMPTZ,
  delivery_proof_url TEXT,
  delivery_signature_url TEXT,
  delivered_at TIMESTAMPTZ,

  -- Documents
  contract_url TEXT,

  -- Paiement
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: ratings (évaluations)
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (char_length(comment) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(booking_id, rater_id, rated_id)
);

-- Table: messages (messagerie)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: transactions (historique des paiements)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  traveler_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type transaction_type_enum NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  status transaction_status_enum NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =================================================================
-- INDEXES
-- =================================================================

-- Indexes pour les profiles
CREATE INDEX idx_profiles_kyc_status ON profiles(kyc_status);
CREATE INDEX idx_profiles_phone ON profiles(phone);

-- Indexes pour les announcements
CREATE INDEX idx_announcements_traveler_id ON announcements(traveler_id);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_departure_date ON announcements(departure_date);
CREATE INDEX idx_announcements_departure_country ON announcements(departure_country);
CREATE INDEX idx_announcements_arrival_country ON announcements(arrival_country);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);

-- Indexes pour les bookings
CREATE INDEX idx_bookings_announcement_id ON bookings(announcement_id);
CREATE INDEX idx_bookings_sender_id ON bookings(sender_id);
CREATE INDEX idx_bookings_traveler_id ON bookings(traveler_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);

-- Indexes pour les ratings
CREATE INDEX idx_ratings_rated_id ON ratings(rated_id);
CREATE INDEX idx_ratings_booking_id ON ratings(booking_id);

-- Indexes pour les messages
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Indexes pour les notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =================================================================
-- TRIGGERS
-- =================================================================

-- Trigger: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Créer automatiquement un profil lors de l'inscription
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, firstname, lastname, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'firstname', 'Prénom'),
    COALESCE(NEW.raw_user_meta_data->>'lastname', 'Nom'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();

-- Trigger: Générer QR code pour booking
CREATE OR REPLACE FUNCTION generate_qr_code_for_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code = encode(digest(NEW.id::text || now()::text, 'sha256'), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_qr_code
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_qr_code_for_booking();

-- =================================================================
-- ROW LEVEL SECURITY (RLS)
-- =================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies pour announcements
CREATE POLICY "Announcements are viewable by everyone"
  ON announcements FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own announcements"
  ON announcements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = traveler_id);

CREATE POLICY "Users can update their own announcements"
  ON announcements FOR UPDATE
  TO authenticated
  USING (auth.uid() = traveler_id);

CREATE POLICY "Users can delete their own announcements"
  ON announcements FOR DELETE
  TO authenticated
  USING (auth.uid() = traveler_id);

-- RLS Policies pour bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = traveler_id OR
    auth.uid() IN (
      SELECT traveler_id FROM announcements WHERE id = announcement_id
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders and travelers can update bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = sender_id OR
    auth.uid() = traveler_id OR
    auth.uid() IN (
      SELECT traveler_id FROM announcements WHERE id = announcement_id
    )
  );

-- RLS Policies pour ratings
CREATE POLICY "Ratings are viewable by everyone"
  ON ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings for their bookings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = rater_id);

-- RLS Policies pour messages
CREATE POLICY "Users can view their own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- RLS Policies pour notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies pour transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = traveler_id);

-- =================================================================
-- COMMENTAIRES
-- =================================================================

COMMENT ON TABLE profiles IS 'Profils utilisateurs liés à auth.users';
COMMENT ON TABLE announcements IS 'Annonces de voyage publiées par les voyageurs';
COMMENT ON TABLE bookings IS 'Réservations de transport de colis';
COMMENT ON TABLE ratings IS 'Évaluations entre utilisateurs';
COMMENT ON TABLE messages IS 'Messages entre utilisateurs';
COMMENT ON TABLE notifications IS 'Notifications utilisateurs';
COMMENT ON TABLE transactions IS 'Historique des transactions financières';

COMMENT ON COLUMN announcements.available_kg IS 'Poids maximal disponible pour le transport en kilogrammes';
COMMENT ON COLUMN announcements.reserved_kg IS 'Poids déjà réservé en kilogrammes';
COMMENT ON COLUMN bookings.qr_code IS 'Code QR unique pour le suivi du colis';











