-- Migration: Add Sendbox-specific fields to announcements
-- is_sendbox: true if the announcement is a Sendbox-managed suitcase batch (not P2P)
-- sendbox_available: true if the traveler is willing to carry a Sendbox suitcase

ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS is_sendbox BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sendbox_available BOOLEAN DEFAULT false;

-- Index to quickly filter Sendbox announcements in search and admin
CREATE INDEX IF NOT EXISTS idx_announcements_is_sendbox ON announcements(is_sendbox) WHERE is_sendbox = true;
CREATE INDEX IF NOT EXISTS idx_announcements_sendbox_available ON announcements(sendbox_available) WHERE sendbox_available = true;

-- Allow public read of these new columns (already covered by existing RLS policies)
-- No additional policy needed — announcements table already has public read for active rows
