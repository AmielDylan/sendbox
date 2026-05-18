-- Fix create_notification: drop the notification_type overload added in previous migration,
-- keep TEXT signature but cast p_type to notification_type in the INSERT.
-- This avoids breaking existing callers while resolving the lint error.

DROP FUNCTION IF EXISTS public.create_notification(UUID, notification_type, TEXT, TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_content TEXT,
  p_booking_id UUID DEFAULT NULL,
  p_announcement_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    content,
    booking_id,
    announcement_id
  )
  VALUES (
    p_user_id,
    p_type::notification_type,
    p_title,
    p_content,
    p_booking_id,
    p_announcement_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;
