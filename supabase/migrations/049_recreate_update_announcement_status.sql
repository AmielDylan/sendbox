-- Migration: Recréer la fonction update_announcement_status avec available_kg
-- Created: 2026-01-01
-- Description: S'assure que la fonction trigger utilise bien available_kg et non max_weight_kg

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS update_announcement_status() CASCADE;

-- Recréer la fonction avec available_kg
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
      WHEN v_remaining_kg <= 0 THEN 'fully_booked'
      WHEN v_remaining_kg < v_available_kg THEN 'partially_booked'
      ELSE 'active'
    END,
    reserved_kg = v_reserved_kg
  WHERE id = NEW.announcement_id;

  RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS on_booking_status_changed ON bookings;

CREATE TRIGGER on_booking_status_changed
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_announcement_status();

-- Commentaire
COMMENT ON FUNCTION update_announcement_status() IS 'Met à jour le statut de l''annonce en fonction des réservations - utilise available_kg';
