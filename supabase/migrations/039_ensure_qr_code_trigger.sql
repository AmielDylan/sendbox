-- Migration: S'assurer que le trigger de génération de QR code existe
-- Le trigger génère automatiquement un code QR unique lors de la création d'un booking

-- Fonction pour générer un QR code unique (format: XXXX-XXXX-XXXX)
CREATE OR REPLACE FUNCTION generate_booking_qr_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Exclut 0, O, I, 1 pour éviter confusion
  result_code TEXT := '';
  i INTEGER;
  segment TEXT;
BEGIN
  -- Générer 3 segments de 4 caractères
  FOR i IN 1..3 LOOP
    segment := '';
    FOR j IN 1..4 LOOP
      segment := segment || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;

    IF i = 1 THEN
      result_code := segment;
    ELSE
      result_code := result_code || '-' || segment;
    END IF;
  END LOOP;

  -- Vérifier l'unicité (très peu probable mais sécurité)
  WHILE EXISTS (SELECT 1 FROM bookings WHERE qr_code = result_code) LOOP
    -- Régénérer si collision
    result_code := '';
    FOR i IN 1..3 LOOP
      segment := '';
      FOR j IN 1..4 LOOP
        segment := segment || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
      END LOOP;

      IF i = 1 THEN
        result_code := segment;
      ELSE
        result_code := result_code || '-' || segment;
      END IF;
    END LOOP;
  END LOOP;

  RETURN result_code;
END;
$$ LANGUAGE plpgsql;

-- Fonction trigger pour générer automatiquement le QR code
CREATE OR REPLACE FUNCTION set_booking_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le QR code est vide ou NULL, en générer un nouveau
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := generate_booking_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer et recréer le trigger
DROP TRIGGER IF EXISTS generate_qr_code_on_booking_insert ON bookings;
CREATE TRIGGER generate_qr_code_on_booking_insert
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION set_booking_qr_code();

-- Tester la fonction
DO $$
DECLARE
  test_qr TEXT;
BEGIN
  test_qr := generate_booking_qr_code();
  RAISE NOTICE 'Test QR code généré: %', test_qr;

  IF LENGTH(test_qr) = 14 AND test_qr ~ '^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$' THEN
    RAISE NOTICE '✅ Format du QR code valide';
  ELSE
    RAISE WARNING '⚠️  Format du QR code invalide: %', test_qr;
  END IF;
END $$;
