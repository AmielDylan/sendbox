-- Migration: Nettoyer les contraintes de clés étrangères dupliquées
-- Problème: La table announcements a deux foreign keys vers profiles sur traveler_id
-- Cela crée une ambiguïté lors des requêtes Supabase avec embed

-- Lister toutes les contraintes foreign key sur announcements.traveler_id
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  RAISE NOTICE 'Contraintes foreign key actuelles sur announcements.traveler_id:';

  FOR constraint_record IN
    SELECT con.conname
    FROM pg_constraint con
    INNER JOIN pg_class rel ON rel.oid = con.conrelid
    INNER JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
    WHERE rel.relname = 'announcements'
    AND att.attname = 'traveler_id'
    AND con.contype = 'f'
  LOOP
    RAISE NOTICE '  - %', constraint_record.conname;
  END LOOP;
END $$;

-- Supprimer toutes les contraintes foreign key sur traveler_id
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_user_id_fkey;
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_traveler_id_fkey;

-- Recréer UNE SEULE contrainte avec le bon nom
ALTER TABLE announcements
ADD CONSTRAINT announcements_traveler_id_fkey
FOREIGN KEY (traveler_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Vérifier le résultat
DO $$
DECLARE
  constraint_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO constraint_count
  FROM pg_constraint con
  INNER JOIN pg_class rel ON rel.oid = con.conrelid
  INNER JOIN pg_attribute att ON att.attnum = ANY(con.conkey) AND att.attrelid = con.conrelid
  WHERE rel.relname = 'announcements'
  AND att.attname = 'traveler_id'
  AND con.contype = 'f';

  IF constraint_count = 1 THEN
    RAISE NOTICE '✅ OK: Une seule contrainte foreign key sur traveler_id';
  ELSE
    RAISE WARNING '⚠️  ATTENTION: % contraintes trouvées sur traveler_id', constraint_count;
  END IF;
END $$;
