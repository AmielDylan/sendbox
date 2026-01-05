-- Ajouter REPLICA IDENTITY FULL pour transmission complète via Realtime
-- Cela permet à Supabase d'envoyer toutes les données du message lors des changements Realtime

ALTER TABLE messages REPLICA IDENTITY FULL;

-- Vérifier la configuration
COMMENT ON TABLE messages IS 'Messages de conversation avec REPLICA IDENTITY FULL pour Realtime';
