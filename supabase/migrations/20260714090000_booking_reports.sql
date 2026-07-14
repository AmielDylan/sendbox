-- Signalements d'imprevus V1 sur les reservations.
-- Un signalement n'est pas un litige formel: il donne une trace exploitable
-- a l'admin sans changer le statut principal de la reservation.

CREATE TABLE IF NOT EXISTS public.booking_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (
    reason IN (
      'traveler_unresponsive',
      'sender_unresponsive',
      'travel_cancelled',
      'travel_postponed',
      'package_mismatch',
      'handoff_impossible',
      'delivery_not_confirmed',
      'other'
    )
  ),
  message TEXT NOT NULL CHECK (char_length(trim(message)) >= 20),
  suggested_new_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (
    status IN ('open', 'reviewing', 'resolved', 'dismissed')
  ),
  admin_note TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_reports_booking_id_idx
  ON public.booking_reports(booking_id);

CREATE INDEX IF NOT EXISTS booking_reports_reported_by_idx
  ON public.booking_reports(reported_by);

CREATE INDEX IF NOT EXISTS booking_reports_status_idx
  ON public.booking_reports(status);

CREATE UNIQUE INDEX IF NOT EXISTS booking_reports_one_open_per_user_booking_idx
  ON public.booking_reports(booking_id, reported_by)
  WHERE status IN ('open', 'reviewing');

DROP TRIGGER IF EXISTS booking_reports_updated_at ON public.booking_reports;
CREATE TRIGGER booking_reports_updated_at
  BEFORE UPDATE ON public.booking_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.booking_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking parties can view reports" ON public.booking_reports;
CREATE POLICY "booking parties can view reports"
  ON public.booking_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings
      WHERE public.bookings.id = public.booking_reports.booking_id
        AND (
          public.bookings.sender_id = auth.uid()
          OR public.bookings.traveler_id = auth.uid()
        )
    )
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "booking parties can create reports" ON public.booking_reports;
CREATE POLICY "booking parties can create reports"
  ON public.booking_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.bookings
      WHERE public.bookings.id = public.booking_reports.booking_id
        AND public.bookings.status <> 'cancelled'
        AND (
          public.bookings.sender_id = auth.uid()
          OR public.bookings.traveler_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "admins can update reports" ON public.booking_reports;
CREATE POLICY "admins can update reports"
  ON public.booking_reports FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));
