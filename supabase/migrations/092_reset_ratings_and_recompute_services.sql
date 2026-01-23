-- Migration: Reset ratings and recompute completed services for travelers
-- Created: 2026-01-23

-- 1) Remove all ratings
DELETE FROM ratings;

-- 2) Reset profile ratings to 0
UPDATE profiles
SET rating = 0;

-- 3) Recompute completed services only for validated deliveries
UPDATE profiles p
SET completed_services = COALESCE(
  (
    SELECT COUNT(*)
    FROM bookings b
    WHERE b.traveler_id = p.id
      AND b.delivery_confirmed_at IS NOT NULL
  ),
  0
);
