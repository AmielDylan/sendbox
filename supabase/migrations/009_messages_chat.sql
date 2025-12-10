-- Migration: Système de chat temps réel
-- Created: 2024-12-10
-- Description: Table messages pour chat entre utilisateurs autour d'une réservation

-- Créer la table messages si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1 AND char_length(content) <= 2000),
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS messages_booking_id_idx ON messages(booking_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_is_read_idx ON messages(is_read) WHERE is_read = FALSE;

-- Index composite pour récupérer les conversations
CREATE INDEX IF NOT EXISTS messages_conversation_idx ON messages(booking_id, created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
CREATE TRIGGER update_messages_updated_at
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_messages_updated_at();

-- RLS Policies
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres messages (en tant que sender ou receiver)
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);

-- Les utilisateurs peuvent créer des messages où ils sont le sender
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
);

-- Les utilisateurs peuvent mettre à jour leurs messages (marquer comme lu)
DROP POLICY IF EXISTS "Users can update received messages" ON messages;
CREATE POLICY "Users can update received messages"
ON messages FOR UPDATE
TO authenticated
USING (
  receiver_id = auth.uid()
)
WITH CHECK (
  receiver_id = auth.uid()
);

-- Fonction pour obtenir les conversations d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  booking_id UUID,
  other_user_id UUID,
  other_user_first_name TEXT,
  other_user_last_name TEXT,
  other_user_avatar_url TEXT,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH conversation_messages AS (
    SELECT DISTINCT ON (m.booking_id)
      m.booking_id,
      CASE
        WHEN m.sender_id = p_user_id THEN m.receiver_id
        ELSE m.sender_id
      END AS other_user_id,
      m.content AS last_message_content,
      m.created_at AS last_message_created_at,
      m.is_read
    FROM messages m
    WHERE m.sender_id = p_user_id OR m.receiver_id = p_user_id
    ORDER BY m.booking_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT
      booking_id,
      COUNT(*) AS unread_count
    FROM messages
    WHERE receiver_id = p_user_id AND is_read = FALSE
    GROUP BY booking_id
  )
  SELECT
    cm.booking_id,
    cm.other_user_id,
    p.first_name::TEXT,
    p.last_name::TEXT,
    p.avatar_url::TEXT,
    cm.last_message_content,
    cm.last_message_created_at,
    COALESCE(uc.unread_count, 0)::BIGINT
  FROM conversation_messages cm
  JOIN profiles p ON p.id = cm.other_user_id
  LEFT JOIN unread_counts uc ON uc.booking_id = cm.booking_id
  ORDER BY
    CASE WHEN COALESCE(uc.unread_count, 0) > 0 THEN 0 ELSE 1 END,
    cm.last_message_created_at DESC;
END;
$$;

-- Créer le bucket pour les pièces jointes si nécessaire
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', FALSE)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies pour le bucket message-attachments
DROP POLICY IF EXISTS "Users can upload message attachments" ON storage.objects;
CREATE POLICY "Users can upload message attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view message attachments" ON storage.objects;
CREATE POLICY "Users can view message attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM messages
      WHERE attachments @> ARRAY[name]
      AND (sender_id = auth.uid() OR receiver_id = auth.uid())
    )
  )
);

-- Commentaires
COMMENT ON TABLE messages IS 'Messages de chat entre utilisateurs autour d''une réservation';
COMMENT ON COLUMN messages.attachments IS 'URLs des pièces jointes (images)';
COMMENT ON COLUMN messages.is_read IS 'Indique si le message a été lu par le destinataire';

