-- Ajoute les statuts du lifecycle trust/frais sur les bases où l'enum
-- s'appelle booking_status au lieu de booking_status_enum.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'matched';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'confirmed';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'handed';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'completed';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_pending';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_enum') THEN
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'matched';
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'confirmed';
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'handed';
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'completed';
    ALTER TYPE booking_status_enum ADD VALUE IF NOT EXISTS 'payment_pending';
  END IF;
END $$;
