-- Migration: Système de ratings
-- Created: 2024-12-10
-- Description: Triggers pour notifications rating_request et update rating moyen

-- Fonction pour créer les notifications de rating_request quand un booking est livré
CREATE OR REPLACE FUNCTION notify_rating_requests()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier que le statut est passé à 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Créer notification pour l'expéditeur
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      booking_id,
      created_at
    ) VALUES (
      NEW.sender_id,
      'rating_request',
      'Service terminé',
      'Notez votre expérience avec ce voyageur',
      NEW.id,
      NOW()
    );

    -- Créer notification pour le voyageur
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      booking_id,
      created_at
    ) VALUES (
      NEW.traveler_id,
      'rating_request',
      'Service terminé',
      'Notez votre expérience avec cet expéditeur',
      NEW.id,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer les notifications
CREATE TRIGGER create_rating_requests_on_delivery
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered'))
EXECUTE FUNCTION notify_rating_requests();

-- Fonction pour mettre à jour le rating moyen d'un utilisateur
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating NUMERIC;
BEGIN
  -- Calculer le rating moyen pour l'utilisateur noté
  SELECT COALESCE(AVG(rating), 0) INTO v_avg_rating
  FROM ratings
  WHERE rated_id = NEW.rated_id;

  -- Mettre à jour le profil
  UPDATE profiles
  SET rating = v_avg_rating
  WHERE id = NEW.rated_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour le rating moyen après insertion d'un rating
CREATE TRIGGER update_rating_on_insert
AFTER INSERT ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

-- Trigger pour mettre à jour le rating moyen après modification d'un rating
CREATE TRIGGER update_rating_on_update
AFTER UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_user_rating();

-- Fonction pour incrémenter le nombre de services complétés
CREATE OR REPLACE FUNCTION increment_completed_services(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET completed_services = COALESCE(completed_services, 0) + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Ajouter colonnes si elles n'existent pas
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_services INTEGER DEFAULT 0;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS ratings_rated_user_id_idx ON ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS ratings_booking_id_idx ON ratings(booking_id);
CREATE INDEX IF NOT EXISTS ratings_rater_id_idx ON ratings(rater_id);

-- Commentaires
COMMENT ON FUNCTION notify_rating_requests() IS 'Crée des notifications rating_request quand un booking est livré';
COMMENT ON FUNCTION update_user_rating() IS 'Met à jour le rating moyen d''un utilisateur';
COMMENT ON FUNCTION increment_completed_services(UUID) IS 'Incrémente le compteur de services complétés';

