-- Reset non-admin users and related data (one-time cleanup)

BEGIN;

SET session_replication_role = replica;

TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE messages CASCADE;
TRUNCATE TABLE ratings CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE announcements CASCADE;

WITH admin_ids AS (
  SELECT id FROM public.profiles WHERE role = 'admin'
)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM admin_ids);

WITH admin_ids AS (
  SELECT id FROM public.profiles WHERE role = 'admin'
)
DELETE FROM auth.users
WHERE id NOT IN (SELECT id FROM admin_ids);

SET session_replication_role = DEFAULT;

COMMIT;
