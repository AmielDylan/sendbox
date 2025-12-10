-- Migration: Compteur de vues pour les annonces
-- Created: 2024-12-10
-- Description: Ajout de la colonne views_count et fonction pour incrémenter

-- Ajouter la colonne views_count si elle n'existe pas
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Fonction pour incrémenter les vues
CREATE OR REPLACE FUNCTION increment_announcement_views(p_announcement_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE announcements
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaire
COMMENT ON COLUMN announcements.views_count IS 'Nombre de vues uniques de l''annonce';
COMMENT ON FUNCTION increment_announcement_views IS 'Incrémente le compteur de vues d''une annonce';

