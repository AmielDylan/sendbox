-- Vérifier le role admin pour admin@gosendbox.com
SELECT
  id,
  email,
  firstname,
  lastname,
  role,
  created_at
FROM profiles
WHERE email = 'admin@gosendbox.com';

-- Vérifier tous les admins
SELECT
  email,
  role
FROM profiles
WHERE role = 'admin'
ORDER BY created_at;
