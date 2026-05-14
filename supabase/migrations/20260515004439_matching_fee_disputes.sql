-- Frais de mise en relation + gestion des litiges
-- Adapté au modèle Sendbox existant : profiles + bookings.

-- ─── Statuts bookings ───────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'payment_pending';
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cgu_accepted_at TIMESTAMPTZ;

-- ─── Frais de mise en relation ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.matching_payments (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id               UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL UNIQUE,
  stripe_client_secret     TEXT NOT NULL,
  amount_cents             INTEGER NOT NULL,
  currency                 TEXT NOT NULL DEFAULT 'eur',
  status                   TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'succeeded', 'failed')),
  paid_by                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS matching_payments_booking_id_idx
  ON public.matching_payments(booking_id);

CREATE INDEX IF NOT EXISTS matching_payments_paid_by_idx
  ON public.matching_payments(paid_by);

CREATE INDEX IF NOT EXISTS matching_payments_status_idx
  ON public.matching_payments(status);

ALTER TABLE public.matching_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own payments only" ON public.matching_payments;
CREATE POLICY "own payments only"
  ON public.matching_payments FOR SELECT
  TO authenticated
  USING (auth.uid() = paid_by);

DROP POLICY IF EXISTS "service role insert matching payments" ON public.matching_payments;
CREATE POLICY "service role insert matching payments"
  ON public.matching_payments FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role update matching payments" ON public.matching_payments;
CREATE POLICY "service role update matching payments"
  ON public.matching_payments FOR UPDATE
  USING (auth.role() = 'service_role');

-- ─── Litiges ────────────────────────────────────────────────────────────────

ALTER TABLE public.disputes
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE TEXT USING status::TEXT,
  ALTER COLUMN status SET DEFAULT 'OPEN';

ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS opened_by_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description  TEXT,
  ADD COLUMN IF NOT EXISTS admin_note   TEXT,
  ADD COLUMN IF NOT EXISTS resolution   TEXT,
  ADD COLUMN IF NOT EXISTS resolved_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

DROP INDEX IF EXISTS public.disputes_booking_id_idx;

CREATE UNIQUE INDEX IF NOT EXISTS disputes_open_booking_id_idx
  ON public.disputes(booking_id)
  WHERE status IN ('OPEN', 'UNDER_REVIEW', 'open', 'under_review');

DROP POLICY IF EXISTS "dispute parties" ON public.disputes;
CREATE POLICY "dispute parties"
  ON public.disputes FOR SELECT
  TO authenticated
  USING (
    auth.uid() = opened_by_id
    OR EXISTS (
      SELECT 1
      FROM public.bookings
      WHERE public.bookings.id = public.disputes.booking_id
        AND (
          public.bookings.sender_id = auth.uid()
          OR public.bookings.traveler_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "booking parties can open disputes" ON public.disputes;
CREATE POLICY "booking parties can open disputes"
  ON public.disputes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = opened_by_id
    AND EXISTS (
      SELECT 1
      FROM public.bookings
      WHERE public.bookings.id = public.disputes.booking_id
        AND (
          public.bookings.sender_id = auth.uid()
          OR public.bookings.traveler_id = auth.uid()
        )
    )
  );

-- ─── Fonctions utilitaires ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS matching_payments_updated_at ON public.matching_payments;
CREATE TRIGGER matching_payments_updated_at
  BEFORE UPDATE ON public.matching_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.increment_dispute_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET disputed_count = COALESCE(disputed_count, 0) + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
