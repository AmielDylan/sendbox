-- Migration: Ajouter les colonnes manquantes dans bookings
-- Le code utilise kilos_requested, package_description et price_per_kg
-- mais la table a weight_kg et description

-- Ajouter les alias/colonnes manquantes
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS kilos_requested NUMERIC CHECK (kilos_requested > 0 AND kilos_requested <= 30),
ADD COLUMN IF NOT EXISTS package_description TEXT,
ADD COLUMN IF NOT EXISTS price_per_kg NUMERIC CHECK (price_per_kg > 0);

-- Migrer les données existantes si nécessaire
UPDATE bookings
SET kilos_requested = weight_kg
WHERE kilos_requested IS NULL AND weight_kg IS NOT NULL;

UPDATE bookings
SET package_description = description
WHERE package_description IS NULL AND description IS NOT NULL;

-- On peut éventuellement supprimer weight_kg et description si on veut standardiser
-- Mais pour éviter de casser des choses, on garde les deux pour l'instant

-- Commentaires
COMMENT ON COLUMN bookings.kilos_requested IS 'Poids demandé pour la réservation en kilogrammes';
COMMENT ON COLUMN bookings.package_description IS 'Description du colis à transporter';
COMMENT ON COLUMN bookings.price_per_kg IS 'Prix par kilogramme au moment de la réservation';
