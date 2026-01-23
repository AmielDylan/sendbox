-- Migration: Add status column to transactions
-- Created: 2026-01-23

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'transaction_status_enum'
  ) THEN
    CREATE TYPE transaction_status_enum AS ENUM ('pending', 'completed', 'failed', 'refunded');
  END IF;
END $$;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS status transaction_status_enum NOT NULL DEFAULT 'pending';

CREATE INDEX IF NOT EXISTS transactions_status_idx ON transactions(status);
