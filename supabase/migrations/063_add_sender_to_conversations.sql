-- Add last_message_sender_id to get_user_conversations function
-- This allows the frontend to determine if the last message was sent by the current user

DROP FUNCTION IF EXISTS get_user_conversations(UUID);

CREATE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  booking_id UUID,
  other_user_id UUID,
  other_user_firstname TEXT,
  other_user_lastname TEXT,
  other_user_avatar_url TEXT,
  last_message_content TEXT,
  last_message_created_at TIMESTAMPTZ,
  last_message_sender_id UUID,
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
      m.sender_id AS last_message_sender_id,
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
    p.firstname::TEXT,
    p.lastname::TEXT,
    p.avatar_url::TEXT,
    cm.last_message_content,
    cm.last_message_created_at,
    cm.last_message_sender_id,
    COALESCE(uc.unread_count, 0)::BIGINT
  FROM conversation_messages cm
  JOIN profiles p ON p.id = cm.other_user_id
  LEFT JOIN unread_counts uc ON uc.booking_id = cm.booking_id
  ORDER BY cm.last_message_created_at DESC;
END;
$$;
