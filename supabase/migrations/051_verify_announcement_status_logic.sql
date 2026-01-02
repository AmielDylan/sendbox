-- Migration: Vérification et documentation du statut des annonces
-- Created: 2026-01-02
-- Description: Vérifie que le statut d'une annonce est correctement calculé

-- LOGIQUE DU STATUT D'ANNONCE:
--
-- Une annonce peut avoir les statuts suivants:
-- - 'active': Annonce active avec de l'espace disponible
-- - 'partially_booked': Annonce avec des réservations mais encore de l'espace
-- - 'fully_booked': Annonce complètement réservée (0 kg disponible)
-- - 'cancelled': Annonce annulée par le voyageur (MANUEL uniquement)
-- - 'completed': Voyage terminé (MANUEL ou automatique après date de départ)
--
-- IMPORTANT: Une annonce ne passe JAMAIS à 'cancelled' automatiquement
-- même si toutes ses réservations sont annulées. Elle redevient 'active'.
--
-- Le trigger update_announcement_status() compte uniquement les bookings actifs:
-- - accepted, paid, deposited, in_transit, delivered
-- Les bookings 'pending' ou 'cancelled' ne sont PAS comptés dans reserved_kg
--
-- EXEMPLE:
-- Annonce: 10 kg disponibles
-- Booking 1: 3 kg (status='paid') → Annonce: 'partially_booked', 7 kg restants
-- Booking 2: 5 kg (status='accepted') → Annonce: 'partially_booked', 2 kg restants
-- Booking 1 annulé → Annonce: 'partially_booked', 7 kg restants (seul Booking 2 compté)
-- Booking 2 annulé → Annonce: 'active', 10 kg restants (aucun booking actif)

-- Vérifier que la fonction existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_announcement_status'
  ) THEN
    RAISE EXCEPTION 'Fonction update_announcement_status manquante!';
  END IF;

  RAISE NOTICE '✅ Fonction update_announcement_status existe';
END $$;

-- Vérifier que le trigger existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_booking_status_changed'
  ) THEN
    RAISE EXCEPTION 'Trigger on_booking_status_changed manquant!';
  END IF;

  RAISE NOTICE '✅ Trigger on_booking_status_changed existe';
END $$;

-- Afficher la définition du trigger pour vérification
SELECT
  tgname AS trigger_name,
  tgtype AS trigger_type,
  tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'on_booking_status_changed';

COMMENT ON TRIGGER on_booking_status_changed ON bookings IS
'Met à jour automatiquement le statut de l''annonce après INSERT ou UPDATE du statut d''une réservation.
Ne compte que les bookings actifs (accepted, paid, deposited, in_transit, delivered).
Les bookings pending ou cancelled ne sont PAS comptés.';
