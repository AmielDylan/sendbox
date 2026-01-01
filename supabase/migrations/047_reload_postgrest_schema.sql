-- Migration: Force PostgREST à recharger le schéma
-- Created: 2026-01-01
-- Description: Envoie un signal NOTIFY pour forcer PostgREST à recharger le schéma
-- Utile après des changements de colonnes (max_weight_kg -> available_kg)

-- PostgREST écoute les notifications sur le canal 'pgrst'
-- Envoyer 'reload schema' ou 'reload config' force le rechargement
NOTIFY pgrst, 'reload schema';

-- Commentaire pour tracer le rechargement
COMMENT ON SCHEMA public IS 'Schema rechargé le 2026-01-01 pour corriger le cache PostgREST après migration available_kg';
