-- Migration: Delivery confirmation tracking + notifications enum + RLS-safe increment
-- Created: 2026-01-22

-- 1) Add delivery confirmation metadata on bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS delivery_confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivery_confirmed_by UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_delivery_confirmed_by_fkey'
      AND table_name = 'bookings'
      AND constraint_type = 'FOREIGN KEY'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_delivery_confirmed_by_fkey
      FOREIGN KEY (delivery_confirmed_by) REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2) Add delivery_confirmed notification type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'notification_type' AND e.enumlabel = 'delivery_confirmed'
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'delivery_confirmed';
  END IF;
END $$;

-- 3) Make increment_completed_services RLS-safe
CREATE OR REPLACE FUNCTION increment_completed_services(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET completed_services = COALESCE(completed_services, 0) + 1
  WHERE id = p_user_id;
END;
$$;
