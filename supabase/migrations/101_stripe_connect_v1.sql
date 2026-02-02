-- Migration: Stripe Connect V1 (payments/transfers/disputes + profiles fields)
-- Created: 2026-01-30
-- Description: Core tables and fields for Connect (separate charges & transfers)

-- Enums (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status_enum') THEN
    CREATE TYPE payment_status_enum AS ENUM (
      'requires_payment_method',
      'requires_confirmation',
      'succeeded',
      'refunded',
      'partially_refunded'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transfer_status_enum') THEN
    CREATE TYPE transfer_status_enum AS ENUM (
      'pending',
      'paid',
      'failed',
      'reversed'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status_enum') THEN
    CREATE TYPE dispute_status_enum AS ENUM (
      'none',
      'open',
      'won_by_sender',
      'won_by_traveler',
      'resolved'
    );
  END IF;
END $$;

-- Profiles: Connect fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_requirements JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_connect_account_id_idx
  ON public.profiles(stripe_connect_account_id)
  WHERE stripe_connect_account_id IS NOT NULL;

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_total NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'eur',
  status payment_status_enum NOT NULL DEFAULT 'requires_payment_method',
  captured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_booking_id_idx ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS payments_stripe_payment_intent_id_idx
  ON public.payments(stripe_payment_intent_id);

-- Transfers table
CREATE TABLE IF NOT EXISTS public.transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_transfer_id TEXT UNIQUE,
  amount NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  status transfer_status_enum NOT NULL DEFAULT 'pending',
  attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transfers_booking_id_idx ON public.transfers(booking_id);
CREATE INDEX IF NOT EXISTS transfers_stripe_transfer_id_idx
  ON public.transfers(stripe_transfer_id);

-- Disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  status dispute_status_enum NOT NULL DEFAULT 'open',
  reason TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS disputes_booking_id_idx ON public.disputes(booking_id);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Payments policies
DROP POLICY IF EXISTS "Users can view payments for their bookings" ON public.payments;
CREATE POLICY "Users can view payments for their bookings"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE public.bookings.id = public.payments.booking_id
        AND (public.bookings.sender_id = auth.uid() OR public.bookings.traveler_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Users can insert payments for their bookings" ON public.payments;
CREATE POLICY "Users can insert payments for their bookings"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE public.bookings.id = public.payments.booking_id
        AND (public.bookings.sender_id = auth.uid() OR public.bookings.traveler_id = auth.uid())
    )
  );

-- Transfers policies
DROP POLICY IF EXISTS "Users can view transfers for their bookings" ON public.transfers;
CREATE POLICY "Users can view transfers for their bookings"
  ON public.transfers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE public.bookings.id = public.transfers.booking_id
        AND (public.bookings.sender_id = auth.uid() OR public.bookings.traveler_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can view all transfers" ON public.transfers;
CREATE POLICY "Admins can view all transfers"
  ON public.transfers FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert transfers" ON public.transfers;
CREATE POLICY "Admins can insert transfers"
  ON public.transfers FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Disputes policies
DROP POLICY IF EXISTS "Users can view disputes for their bookings" ON public.disputes;
CREATE POLICY "Users can view disputes for their bookings"
  ON public.disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE public.bookings.id = public.disputes.booking_id
        AND (public.bookings.sender_id = auth.uid() OR public.bookings.traveler_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Sender can open disputes" ON public.disputes;
CREATE POLICY "Sender can open disputes"
  ON public.disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE public.bookings.id = public.disputes.booking_id
        AND public.bookings.sender_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
CREATE POLICY "Admins can view all disputes"
  ON public.disputes FOR SELECT
  TO authenticated
  USING (is_admin());
