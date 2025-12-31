-- Migration: Système de notifications
-- Created: 2024-12-10
-- Description: Table notifications et champs booking pour refus

-- Ajouter des colonnes supplémentaires à la table notifications (créée par migration 001)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE;

-- Renommer la colonne message en content si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'message'
  ) THEN
    ALTER TABLE notifications RENAME COLUMN message TO content;
  END IF;
END $$;

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_at_idx ON notifications(read_at);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_booking_id_idx ON notifications(booking_id);

-- RLS Policies (déjà définies dans migration 001)
-- On les garde activées mais ne les recrée pas pour éviter les conflits
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_content TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_announcement_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    content,
    booking_id,
    announcement_id
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_content,
    p_booking_id,
    p_announcement_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter colonne refused_reason aux bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS refused_reason TEXT,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS refused_at TIMESTAMPTZ;

-- Fonction pour compter les notifications non lues
CREATE OR REPLACE FUNCTION count_unread_notifications(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = p_user_id AND read_at IS NULL;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE notifications IS 'Notifications in-app pour les utilisateurs';
COMMENT ON COLUMN bookings.refused_reason IS 'Raison du refus si la demande a été refusée';
COMMENT ON COLUMN bookings.accepted_at IS 'Date d''acceptation de la demande';
COMMENT ON COLUMN bookings.refused_at IS 'Date de refus de la demande';

