-- Fix lint errors in two DB functions
-- 1. create_notification: cast p_type text → notification_type (type mismatch error)
-- 2. generate_booking_qr_code: remove unused declared variable i (shadowed by FOR loop auto var)

-- Fix 1: create_notification — changer p_type TEXT en notification_type
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type notification_type,
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
    p_type,
    p_title,
    p_content,
    p_booking_id,
    p_announcement_id
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Fix 2: generate_booking_qr_code — retirer la déclaration "i INTEGER" inutilisée
-- (le FOR loop crée sa propre variable auto i qui la shadowait)
CREATE OR REPLACE FUNCTION generate_booking_qr_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result_code TEXT := '';
  segment TEXT;
BEGIN
  FOR i IN 1..3 LOOP
    segment := '';
    FOR j IN 1..4 LOOP
      segment := segment || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    IF i = 1 THEN
      result_code := segment;
    ELSE
      result_code := result_code || '-' || segment;
    END IF;
  END LOOP;

  WHILE EXISTS (SELECT 1 FROM bookings WHERE qr_code = result_code) LOOP
    result_code := '';
    FOR i IN 1..3 LOOP
      segment := '';
      FOR j IN 1..4 LOOP
        segment := segment || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;
      IF i = 1 THEN
        result_code := segment;
      ELSE
        result_code := result_code || '-' || segment;
      END IF;
    END LOOP;
  END LOOP;

  RETURN result_code;
END;
$$ LANGUAGE plpgsql;
