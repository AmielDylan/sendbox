-- Activer Realtime pour la table messages
-- Cela permet aux clients de s'abonner aux changements en temps réel

-- Vérifier que la publication supabase_realtime existe
DO $$
BEGIN
  -- Ajouter la table messages à la publication Realtime si elle n'y est pas déjà
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    RAISE NOTICE 'Table messages ajoutée à la publication Realtime';
  ELSE
    RAISE NOTICE 'Table messages déjà dans la publication Realtime';
  END IF;
END $$;

-- Vérifier aussi pour les notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    RAISE NOTICE 'Table notifications ajoutée à la publication Realtime';
  ELSE
    RAISE NOTICE 'Table notifications déjà dans la publication Realtime';
  END IF;
END $$;

COMMENT ON PUBLICATION supabase_realtime IS
  'Publication Realtime incluant messages et notifications pour les mises à jour en temps réel';
