-- Migration: Fix All Existing Policies
-- Created: 2024-12-10
-- Description: Supprime et recrée toutes les politiques RLS pour éviter les conflits

-- Supprimer toutes les politiques existantes qui pourraient causer des conflits
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can view their own ratings" ON ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON ratings;

-- Recréer les politiques notifications
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Recréer les politiques transactions
CREATE POLICY "Users can view their own transactions"
ON transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all transactions"
ON transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Recréer les politiques messages
CREATE POLICY "Users can send messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can view their own messages"
ON messages FOR SELECT
TO authenticated
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Recréer les politiques ratings
CREATE POLICY "Users can view their own ratings"
ON ratings FOR SELECT
TO authenticated
USING (rater_id = auth.uid() OR rated_id = auth.uid());

CREATE POLICY "Users can create ratings"
ON ratings FOR INSERT
TO authenticated
WITH CHECK (rater_id = auth.uid());











