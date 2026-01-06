-- Migration: Add missing RLS policies for bookings table
-- Created: 2024-12-19
-- Description: Ajouter les politiques RLS manquantes pour que les utilisateurs puissent lire leurs propres bookings

-- Activer RLS sur la table bookings si ce n'est pas déjà fait
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own bookings as sender" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings as traveler" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;

-- Politique pour lire ses propres bookings (en tant qu'expéditeur OU voyageur)
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid() OR traveler_id = auth.uid()
);

-- Politique pour créer des bookings (en tant qu'expéditeur)
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
);

-- Politique pour mettre à jour ses propres bookings
-- L'expéditeur peut mettre à jour ses bookings
-- Le voyageur peut accepter/refuser (changer le statut)
CREATE POLICY "Users can update their own bookings"
ON bookings FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid() OR traveler_id = auth.uid()
)
WITH CHECK (
  sender_id = auth.uid() OR traveler_id = auth.uid()
);

-- Commentaire
COMMENT ON POLICY "Users can view their own bookings" ON bookings IS 'Les utilisateurs peuvent voir leurs bookings en tant qu''expéditeur ou voyageur';
COMMENT ON POLICY "Users can create bookings" ON bookings IS 'Les utilisateurs peuvent créer des bookings en tant qu''expéditeur';
COMMENT ON POLICY "Users can update their own bookings" ON bookings IS 'Les utilisateurs peuvent mettre à jour leurs bookings';








