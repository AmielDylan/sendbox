-- Migration: Create First Admin User
-- Created: 2024-12-19
-- Description: Promouvoir le premier utilisateur (amieladjovi@yahoo.fr) en admin

-- Trouver et promouvoir l'utilisateur par email
UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'amieladjovi@yahoo.fr'
  LIMIT 1
);

-- Vérifier le résultat
DO $$ 
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM profiles
  WHERE role = 'admin';
  
  RAISE NOTICE 'Nombre d''administrateurs après migration: %', v_count;
END $$;

-- Commentaire
COMMENT ON COLUMN profiles.role IS 'user | admin - définit les permissions d''accès';






