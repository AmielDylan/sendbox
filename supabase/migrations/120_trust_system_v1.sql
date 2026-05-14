-- ─── Nouveaux enums ────────────────────────────────────────────────────────────

CREATE TYPE review_status_enum AS ENUM (
  'pending', 'submitted', 'published', 'skipped'
);

CREATE TYPE photo_type_enum AS ENUM ('handoff', 'delivery');

CREATE TYPE flag_reason_enum AS ENUM (
  'concentration_ratio', 'duration_too_short', 'ring_collusion', 'manual'
);

CREATE TYPE verification_status_enum AS ENUM (
  'none', 'pending', 'verified', 'rejected'
);

-- Étendre booking_status_enum avec les nouveaux statuts du lifecycle trust
-- (PostgreSQL ne permet pas de supprimer des valeurs, on ajoute uniquement)
ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'matched';
ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'handed';
ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'completed';

-- ─── Profils : champs trust ────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trust_score            NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_count        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disputed_count         INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_sender_count    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_traveler_count  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_suspended           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_reason       TEXT,
  ADD COLUMN IF NOT EXISTS verification_status    verification_status_enum DEFAULT 'none';

-- ─── Bookings : lifecycle trust ────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS status_history            JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS sender_confirmed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS traveler_confirmed_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handed_at                 TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS duration_hours            NUMERIC,
  ADD COLUMN IF NOT EXISTS is_flagged                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_reason               TEXT;

-- ─── Nouvelle table : booking_photos ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS booking_photos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  uploaded_by_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type             photo_type_enum NOT NULL,
  url              TEXT NOT NULL,
  file_hash        TEXT NOT NULL,
  -- capturedAt est TOUJOURS généré serveur — jamais extrait des métadonnées EXIF
  captured_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  size_bytes       INTEGER NOT NULL,
  confirmed_by_id  UUID REFERENCES profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_photos_booking_id ON booking_photos(booking_id);

ALTER TABLE booking_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties can view their booking photos"
  ON booking_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id
        AND (b.sender_id = auth.uid() OR b.traveler_id = auth.uid())
    )
  );

-- ─── Ratings : système de soumission en aveugle ────────────────────────────────

ALTER TABLE ratings
  ADD COLUMN IF NOT EXISTS status       review_status_enum DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- ─── Disputes : visibilité publique ───────────────────────────────────────────

ALTER TABLE disputes
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- ─── Nouvelle table : user_flags ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason       flag_reason_enum NOT NULL,
  detail       TEXT,
  resolved_at  TIMESTAMPTZ,
  resolved_by  UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_flags_user_id  ON user_flags(user_id);
CREATE INDEX IF NOT EXISTS idx_user_flags_resolved ON user_flags(resolved_at);

ALTER TABLE user_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user flags"
  ON user_flags FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── Fonction PostgreSQL : détection d'anneaux (recursive CTE) ───────────────
-- Appelée via supabase.rpc('detect_review_ring', { p_user_id, p_depth })

CREATE OR REPLACE FUNCTION detect_review_ring(p_user_id UUID, p_depth INTEGER DEFAULT 3)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH RECURSIVE review_graph AS (
    SELECT
      r.rater_id   AS author_id,
      r.rated_id   AS subject_id,
      1            AS depth,
      ARRAY[r.rater_id] AS path
    FROM ratings r
    WHERE r.rater_id = p_user_id
      AND r.status = 'published'

    UNION ALL

    SELECT
      r.rater_id,
      r.rated_id,
      rg.depth + 1,
      rg.path || r.rater_id
    FROM ratings r
    JOIN review_graph rg ON r.rater_id = rg.subject_id
    WHERE rg.depth < p_depth
      AND NOT (r.rater_id = ANY(rg.path))
      AND r.status = 'published'
  )
  SELECT EXISTS (
    SELECT 1 FROM review_graph
    WHERE subject_id = p_user_id AND depth > 1
  );
$$;
