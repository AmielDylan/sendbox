-- Migration: Corriger manuellement le booking payé
-- Created: 2026-01-02
-- Description: Fix booking qui a un payment_intent_id mais pas de paid_at

-- Corriger le booking spécifique
UPDATE bookings
SET
  status = 'paid',
  paid_at = updated_at  -- Utiliser la date de dernière mise à jour
WHERE
  id = 'be79531f-aae2-4844-a86b-a1492d09e5b8'
  AND payment_intent_id IS NOT NULL
  AND paid_at IS NULL;

-- Afficher le résultat
SELECT
  id,
  status,
  payment_intent_id,
  paid_at,
  qr_code,
  created_at,
  updated_at
FROM bookings
WHERE id = 'be79531f-aae2-4844-a86b-a1492d09e5b8';

-- Fonction générique pour corriger tous les bookings avec payment_intent mais sans paid_at
-- (au cas où il y en aurait d'autres)
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  UPDATE bookings
  SET
    status = 'paid',
    paid_at = COALESCE(updated_at, created_at)
  WHERE
    payment_intent_id IS NOT NULL
    AND paid_at IS NULL
    AND status != 'paid';

  GET DIAGNOSTICS fixed_count = ROW_COUNT;

  IF fixed_count > 0 THEN
    RAISE NOTICE '✅ % booking(s) corrigé(s)', fixed_count;
  ELSE
    RAISE NOTICE 'ℹ️  Aucun booking à corriger';
  END IF;
END $$;
