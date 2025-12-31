-- Migration pour supprimer en cascade toutes les données d'un utilisateur
-- Quand un user est supprimé dans auth.users, toutes ses données sont supprimées automatiquement

-- 1. Supprimer les contraintes FK existantes et les recréer avec ON DELETE CASCADE

-- Table: profiles
-- Déjà lié à auth.users via le trigger, mais on s'assure de la cascade
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Table: announcements (lié à profiles.id qui est lié à auth.users.id)
ALTER TABLE announcements DROP CONSTRAINT IF EXISTS announcements_traveler_id_fkey;
ALTER TABLE announcements
  ADD CONSTRAINT announcements_traveler_id_fkey
  FOREIGN KEY (traveler_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Table: bookings (lié aux annonces et aux profils)
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_announcement_id_fkey;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_announcement_id_fkey
  FOREIGN KEY (announcement_id)
  REFERENCES announcements(id)
  ON DELETE CASCADE;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_sender_id_fkey;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_traveler_id_fkey;
ALTER TABLE bookings
  ADD CONSTRAINT bookings_traveler_id_fkey
  FOREIGN KEY (traveler_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Table: ratings (lié aux bookings et aux profils)
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_booking_id_fkey;
ALTER TABLE ratings
  ADD CONSTRAINT ratings_booking_id_fkey
  FOREIGN KEY (booking_id)
  REFERENCES bookings(id)
  ON DELETE CASCADE;

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_rater_id_fkey;
ALTER TABLE ratings
  ADD CONSTRAINT ratings_rater_id_fkey
  FOREIGN KEY (rater_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_rated_id_fkey;
ALTER TABLE ratings
  ADD CONSTRAINT ratings_rated_id_fkey
  FOREIGN KEY (rated_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Table: messages (conversations entre utilisateurs)
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages
  ADD CONSTRAINT messages_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE messages
  ADD CONSTRAINT messages_receiver_id_fkey
  FOREIGN KEY (receiver_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- Table: notifications
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE notifications
  ADD CONSTRAINT notifications_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES profiles(id)
  ON DELETE CASCADE;

-- 2. Créer une fonction pour nettoyer les fichiers storage lors de la suppression
-- (Les fichiers dans storage ne sont pas automatiquement supprimés avec CASCADE)
CREATE OR REPLACE FUNCTION cleanup_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Supprimer tous les fichiers de l'utilisateur dans les buckets storage
  -- Note: Ceci supprime les métadonnées, les fichiers physiques sont nettoyés par Supabase Storage
  DELETE FROM storage.objects
  WHERE bucket_id IN ('kyc-documents', 'signatures', 'package-photos', 'deposits', 'deliveries')
  AND (storage.foldername(name))[1] = OLD.id::text;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour nettoyer le storage quand un profil est supprimé
DROP TRIGGER IF EXISTS cleanup_user_storage_trigger ON profiles;
CREATE TRIGGER cleanup_user_storage_trigger
  BEFORE DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_user_storage();

-- Commentaires pour documentation
COMMENT ON CONSTRAINT profiles_id_fkey ON profiles IS 'Supprime le profil quand l''utilisateur auth est supprimé';
COMMENT ON CONSTRAINT announcements_traveler_id_fkey ON announcements IS 'Supprime les annonces quand le profil est supprimé';
COMMENT ON CONSTRAINT bookings_announcement_id_fkey ON bookings IS 'Supprime les réservations quand l''annonce est supprimée';
COMMENT ON FUNCTION cleanup_user_storage() IS 'Nettoie les fichiers storage quand un utilisateur est supprimé';
