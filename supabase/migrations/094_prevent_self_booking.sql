-- Migration: Prevent users from booking their own announcements
-- Created: 2026-01-23

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_sender_not_traveler'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_sender_not_traveler
      CHECK (sender_id <> traveler_id) NOT VALID;
  END IF;
END $$;
