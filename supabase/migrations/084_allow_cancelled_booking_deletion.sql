-- Autoriser la suppression des réservations annulées par l'expéditeur ou le voyageur

DROP POLICY IF EXISTS "Senders and travelers can delete cancelled bookings" ON bookings;

CREATE POLICY "Senders and travelers can delete cancelled bookings"
  ON bookings FOR DELETE
  TO authenticated
  USING (
    status = 'cancelled'
    AND refused_at IS NOT NULL
    AND (auth.uid() = sender_id OR auth.uid() = traveler_id)
  );
