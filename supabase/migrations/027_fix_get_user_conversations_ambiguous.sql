-- Migration: Fix get_user_conversations ambiguous booking_id
-- Created: 2024-12-11
-- Description: Correction de la référence ambiguë à booking_id dans get_user_conversations

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
      m.booking_id,
      COUNT(*) AS unread_count
    FROM messages m
    WHERE m.receiver_id = p_user_id AND m.is_read = FALSE
    GROUP BY m.booking_id
  )
  SELECT
    cm.booking_id,
    cm.other_user_id,
    COALESCE(p.firstname, '')::TEXT AS other_user_first_name,
    COALESCE(p.lastname, '')::TEXT AS other_user_last_name,
    COALESCE(p.avatar_url, '')::TEXT AS other_user_avatar_url,
    cm.last_message_content,
    cm.last_message_created_at,
    COALESCE(uc.unread_count, 0)::BIGINT AS unread_count
  FROM conversation_messages cm
  JOIN profiles p ON p.id = cm.other_user_id
  LEFT JOIN unread_counts uc ON uc.booking_id = cm.booking_id
  ORDER BY
    CASE WHEN COALESCE(uc.unread_count, 0) > 0 THEN 0 ELSE 1 END,
    cm.last_message_created_at DESC;
END;
$$;






