-- Migration: Auto-release tracking for Stripe Connect
-- Created: 2026-01-31
-- Description: Add columns to track auto-release after 7-day timeout

-- Add auto-release tracking to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

-- Create index for efficient auto-release queries
CREATE INDEX IF NOT EXISTS bookings_auto_release_at_idx
  ON public.bookings(auto_release_at)
  WHERE status = 'in_transit' AND auto_release_at IS NOT NULL AND released_at IS NULL;

-- Create cron job status table for reliability
CREATE TABLE IF NOT EXISTS public.cron_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, success, failed
  error_message TEXT,
  processed_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cron_job_logs_job_name_idx ON public.cron_job_logs(job_name);
CREATE INDEX IF NOT EXISTS cron_job_logs_updated_at_idx ON public.cron_job_logs(updated_at);

-- Enable RLS on cron_job_logs
ALTER TABLE public.cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view cron logs
DROP POLICY IF EXISTS "Admins can view cron logs" ON public.cron_job_logs;
CREATE POLICY "Admins can view cron logs"
  ON public.cron_job_logs FOR SELECT
  TO authenticated
  USING (is_admin());
