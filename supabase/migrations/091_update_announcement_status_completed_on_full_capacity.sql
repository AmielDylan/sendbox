-- Migration: Mark announcements completed when fully booked
-- Created: 2026-01-22

CREATE OR REPLACE FUNCTION update_announcement_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_kg NUMERIC;
  v_reserved_kg NUMERIC;
  v_remaining_kg NUMERIC;
BEGIN
  -- Récupérer la capacité totale de l'annonce
  SELECT available_kg
  INTO v_available_kg
  FROM announcements
  WHERE id = NEW.announcement_id;

  -- Calculer le poids total réservé (somme des bookings actifs)
  SELECT COALESCE(SUM(kilos_requested), 0)
  INTO v_reserved_kg
  FROM bookings
  WHERE announcement_id = NEW.announcement_id
    AND status IN ('accepted', 'paid', 'deposited', 'in_transit', 'delivered');

  -- Calculer le poids restant
  v_remaining_kg := v_available_kg - v_reserved_kg;

  -- Mettre à jour le statut et le poids réservé de l'annonce
  UPDATE announcements
  SET
    status = CASE
      WHEN v_remaining_kg <= 0 THEN 'completed'::announcement_status
      WHEN v_remaining_kg < v_available_kg THEN 'partially_booked'::announcement_status
      ELSE 'active'::announcement_status
    END,
    reserved_kg = v_reserved_kg
  WHERE id = NEW.announcement_id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_announcement_status() IS 'Met à jour le statut de l''annonce en fonction des réservations - marque en terminée si capacité remplie';
