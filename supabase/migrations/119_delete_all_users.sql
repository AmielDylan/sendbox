-- ⚠️  Migration destructive — supprime tous les comptes utilisateurs
-- À appliquer avant que de vrais utilisateurs s'inscrivent en production.
-- Les FK CASCADE ON DELETE propagent la suppression vers profiles, bookings,
-- announcements, messages, notifications, payments, etc.

DELETE FROM auth.users;
