-- Migration: Fix rating_request notifications RLS
-- Created: 2026-01-22
-- Description:
--   The trigger `create_rating_requests_on_delivery` inserts into `notifications`
--   when a booking transitions to `delivered`. Because RLS is enabled on
--   `notifications` and users can't INSERT, this could fail the booking update
--   with: "new row violates row-level security policy for table \"notifications\"".
--
--   Solution: run the trigger function as SECURITY DEFINER so the inserts bypass RLS.

CREATE OR REPLACE FUNCTION notify_rating_requests()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    -- Notification for sender
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      booking_id,
      announcement_id,
      created_at
    )
    VALUES (
      NEW.sender_id,
      'rating_request',
      'Service terminé',
      'Notez votre expérience avec ce voyageur',
      NEW.id,
      NEW.announcement_id,
      NOW()
    );

    -- Notification for traveler
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      booking_id,
      announcement_id,
      created_at
    )
    VALUES (
      NEW.traveler_id,
      'rating_request',
      'Service terminé',
      'Notez votre expérience avec cet expéditeur',
      NEW.id,
      NEW.announcement_id,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_rating_requests_on_delivery ON bookings;
CREATE TRIGGER create_rating_requests_on_delivery
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered'))
EXECUTE FUNCTION notify_rating_requests();
