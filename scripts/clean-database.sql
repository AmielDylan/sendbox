-- Script de nettoyage de la base de données Supabase
-- Supprime toutes les données sauf les utilisateurs (auth.users et profiles)
-- À exécuter via le SQL Editor de Supabase ou en local

-- =================================================================
-- DÉSACTIVATION TEMPORAIRE DES TRIGGERS ET CONTRAINTES
-- =================================================================
SET session_replication_role = replica;

-- =================================================================
-- SUPPRESSION DES DONNÉES (dans l'ordre des dépendances)
-- =================================================================

-- 1. Supprimer les notifications
TRUNCATE TABLE notifications CASCADE;

-- 2. Supprimer les messages
TRUNCATE TABLE messages CASCADE;

-- 3. Supprimer les évaluations
TRUNCATE TABLE ratings CASCADE;

-- 4. Supprimer les transactions
TRUNCATE TABLE transactions CASCADE;

-- 5. Supprimer les bookings (réservations)
TRUNCATE TABLE bookings CASCADE;

-- 6. Supprimer les annonces
TRUNCATE TABLE announcements CASCADE;

-- =================================================================
-- RÉINITIALISATION DES SÉQUENCES (si applicable)
-- =================================================================
-- Les UUID ne nécessitent pas de réinitialisation de séquence

-- =================================================================
-- RÉACTIVATION DES TRIGGERS ET CONTRAINTES
-- =================================================================
SET session_replication_role = DEFAULT;

-- =================================================================
-- NETTOYAGE DU STORAGE (optionnel - à exécuter séparément si besoin)
-- =================================================================
-- Les buckets de storage ne sont pas supprimés par ce script
-- Pour nettoyer le storage, utilisez les commandes suivantes dans le SQL Editor :

-- Nettoyer les documents KYC
-- DELETE FROM storage.objects WHERE bucket_id = 'kyc-documents';

-- Nettoyer les signatures
-- DELETE FROM storage.objects WHERE bucket_id = 'signatures';

-- Nettoyer les contrats
-- DELETE FROM storage.objects WHERE bucket_id = 'contracts';

-- Nettoyer les preuves de dépôt/livraison
-- DELETE FROM storage.objects WHERE bucket_id = 'package-proofs';

-- =================================================================
-- VÉRIFICATION
-- =================================================================
SELECT
  'announcements' as table_name,
  COUNT(*) as row_count
FROM announcements
UNION ALL
SELECT 'bookings', COUNT(*) FROM bookings
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'ratings', COUNT(*) FROM ratings
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles;

-- =================================================================
-- RÉSULTAT ATTENDU
-- =================================================================
-- Toutes les tables sauf 'profiles' devraient avoir 0 lignes
-- La table 'profiles' conserve tous les utilisateurs existants
