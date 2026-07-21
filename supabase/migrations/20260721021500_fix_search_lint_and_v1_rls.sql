-- Solidification V1: search lint fix and focused RLS consolidation.
-- - Fix ambiguous status reference in search_announcements().
-- - Harden booking_reports insert checks.
-- - Make booking_photos write policy explicit for traveler uploads.
-- - Restrict package-proofs writes to the traveler involved in the booking.

DROP FUNCTION IF EXISTS search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION search_announcements(
  p_departure_country TEXT DEFAULT NULL,
  p_arrival_country TEXT DEFAULT NULL,
  p_departure_date DATE DEFAULT NULL,
  p_min_kg INTEGER DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'date',
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  traveler_id UUID,
  origin_country TEXT,
  origin_city TEXT,
  destination_country TEXT,
  destination_city TEXT,
  departure_date DATE,
  arrival_date DATE,
  max_weight_kg NUMERIC,
  price_per_kg NUMERIC,
  description TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  traveler_first_name TEXT,
  traveler_last_name TEXT,
  traveler_avatar_url TEXT,
  traveler_rating NUMERIC,
  traveler_services_count BIGINT,
  traveler_trust_score NUMERIC,
  traveler_completed_count INTEGER,
  traveler_disputed_count INTEGER,
  match_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  weight_departure NUMERIC := 10;
  weight_arrival NUMERIC := 10;
  weight_date NUMERIC := 20;
  weight_min_kg NUMERIC := 10;
BEGIN
  RETURN QUERY
  SELECT
    scored.id,
    scored.traveler_id,
    scored.origin_country,
    scored.origin_city,
    scored.destination_country,
    scored.destination_city,
    scored.departure_date,
    scored.arrival_date,
    scored.max_weight_kg,
    scored.price_per_kg,
    scored.description,
    scored.status,
    scored.created_at,
    scored.updated_at,
    scored.traveler_first_name,
    scored.traveler_last_name,
    scored.traveler_avatar_url,
    scored.traveler_rating,
    scored.traveler_services_count,
    scored.traveler_trust_score,
    scored.traveler_completed_count,
    scored.traveler_disputed_count,
    CASE
      WHEN scored.max_score > 0 THEN ROUND((scored.score / scored.max_score) * 100)
      ELSE 0
    END::NUMERIC AS match_score
  FROM (
    SELECT
      a.id,
      a.traveler_id,
      a.departure_country AS origin_country,
      a.departure_city AS origin_city,
      a.arrival_country AS destination_country,
      a.arrival_city AS destination_city,
      a.departure_date::DATE,
      a.arrival_date::DATE,
      a.available_kg AS max_weight_kg,
      a.price_per_kg,
      a.description,
      a.status::TEXT,
      a.created_at,
      a.updated_at,
      COALESCE(p.firstname, '') AS traveler_first_name,
      COALESCE(p.lastname, '') AS traveler_last_name,
      p.avatar_url AS traveler_avatar_url,
      COALESCE(
        (
          SELECT AVG(r.rating)::NUMERIC
          FROM public.ratings r
          WHERE r.rated_id = a.traveler_id
            AND r.status = 'published'
        ),
        0
      ) AS traveler_rating,
      COALESCE(p.completed_count, 0)::BIGINT AS traveler_services_count,
      COALESCE(p.trust_score, 0)::NUMERIC AS traveler_trust_score,
      COALESCE(p.completed_count, 0)::INTEGER AS traveler_completed_count,
      COALESCE(p.disputed_count, 0)::INTEGER AS traveler_disputed_count,
      (
        CASE WHEN p_departure_country IS NOT NULL THEN weight_departure ELSE 0 END +
        CASE WHEN p_arrival_country IS NOT NULL THEN weight_arrival ELSE 0 END +
        CASE WHEN p_departure_date IS NOT NULL THEN weight_date ELSE 0 END +
        CASE WHEN p_min_kg IS NOT NULL THEN weight_min_kg ELSE 0 END
      )::NUMERIC AS max_score,
      (
        CASE WHEN p_departure_country IS NOT NULL AND a.departure_country = p_departure_country THEN weight_departure ELSE 0 END +
        CASE WHEN p_arrival_country IS NOT NULL AND a.arrival_country = p_arrival_country THEN weight_arrival ELSE 0 END +
        CASE
          WHEN p_departure_date IS NOT NULL THEN
            CASE
              WHEN a.departure_date = p_departure_date THEN weight_date
              WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date, p_departure_date))) <= 1 THEN weight_date * 0.75
              WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date, p_departure_date))) <= 2 THEN weight_date * 0.5
              WHEN ABS(EXTRACT(DAY FROM AGE(a.departure_date, p_departure_date))) <= 3 THEN weight_date * 0.25
              ELSE 0
            END
          ELSE 0
        END +
        CASE WHEN p_min_kg IS NOT NULL AND a.available_kg >= p_min_kg THEN weight_min_kg ELSE 0 END
      )::NUMERIC AS score
    FROM public.announcements a
    LEFT JOIN public.profiles p ON p.id = a.traveler_id
    WHERE
      a.status IN ('published', 'partially_booked', 'active')
      AND (p_departure_country IS NULL OR a.departure_country = p_departure_country)
      AND (p_arrival_country IS NULL OR a.arrival_country = p_arrival_country)
      AND (
        p_departure_date IS NULL OR
        ABS(EXTRACT(DAY FROM AGE(a.departure_date, p_departure_date))) <= 3
      )
      AND (p_min_kg IS NULL OR a.available_kg >= p_min_kg)
  ) scored
  ORDER BY
    CASE WHEN p_sort_by = 'price' THEN scored.price_per_kg END ASC NULLS LAST,
    CASE WHEN p_sort_by = 'rating' THEN scored.traveler_trust_score END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'date' THEN scored.departure_date END ASC,
    match_score DESC,
    scored.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER) TO anon;

COMMENT ON FUNCTION search_announcements(TEXT, TEXT, DATE, INTEGER, TEXT, INTEGER, INTEGER) IS
  'Public search for announcements. match_score is normalized to 0-100 and V1 traveler trust fields are exposed.';

ALTER TABLE public.booking_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "booking parties can view reports" ON public.booking_reports;
CREATE POLICY "booking parties can view reports"
  ON public.booking_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = public.booking_reports.booking_id
        AND (
          b.sender_id = (SELECT auth.uid())
          OR b.traveler_id = (SELECT auth.uid())
        )
    )
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "booking parties can create reports" ON public.booking_reports;
CREATE POLICY "booking parties can create reports"
  ON public.booking_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    reported_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = public.booking_reports.booking_id
        AND b.status <> 'cancelled'
        AND (
          b.sender_id = (SELECT auth.uid())
          OR b.traveler_id = (SELECT auth.uid())
        )
        AND (
          reported_user_id IS NULL
          OR reported_user_id = CASE
            WHEN b.sender_id = (SELECT auth.uid()) THEN b.traveler_id
            ELSE b.sender_id
          END
        )
    )
  );

DROP POLICY IF EXISTS "admins can update reports" ON public.booking_reports;
CREATE POLICY "admins can update reports"
  ON public.booking_reports FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties can view their booking photos" ON public.booking_photos;
CREATE POLICY "Parties can view their booking photos"
  ON public.booking_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = public.booking_photos.booking_id
        AND (
          b.sender_id = (SELECT auth.uid())
          OR b.traveler_id = (SELECT auth.uid())
        )
    )
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS "Travelers can create booking photos" ON public.booking_photos;
CREATE POLICY "Travelers can create booking photos"
  ON public.booking_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id = public.booking_photos.booking_id
        AND b.traveler_id = (SELECT auth.uid())
        AND (
          (public.booking_photos.type = 'handoff' AND b.status = 'confirmed')
          OR (public.booking_photos.type = 'delivery' AND b.status IN ('handed', 'in_transit'))
        )
    )
  );

ALTER TABLE public.user_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage user flags" ON public.user_flags;
CREATE POLICY "Admins can manage user flags"
  ON public.user_flags FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Users can upload package proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view package proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update package proofs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete package proofs" ON storage.objects;

CREATE POLICY "Users can upload package proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'package-proofs'
    AND (storage.foldername(name))[1] IN ('deposits', 'deliveries')
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.traveler_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can view package proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'package-proofs'
    AND (storage.foldername(name))[1] IN ('deposits', 'deliveries')
    AND (
      EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.id::text = (storage.foldername(name))[2]
          AND (
            b.sender_id = (SELECT auth.uid())
            OR b.traveler_id = (SELECT auth.uid())
          )
      )
      OR (SELECT public.is_admin())
    )
  );

CREATE POLICY "Users can update package proofs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'package-proofs'
    AND (storage.foldername(name))[1] IN ('deposits', 'deliveries')
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.traveler_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    bucket_id = 'package-proofs'
    AND (storage.foldername(name))[1] IN ('deposits', 'deliveries')
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.traveler_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can delete package proofs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'package-proofs'
    AND (storage.foldername(name))[1] IN ('deposits', 'deliveries')
    AND EXISTS (
      SELECT 1
      FROM public.bookings b
      WHERE b.id::text = (storage.foldername(name))[2]
        AND b.traveler_id = (SELECT auth.uid())
    )
  );
