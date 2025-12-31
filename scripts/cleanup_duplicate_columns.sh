#!/bin/bash

# Script pour nettoyer les colonnes dupliquées des annonces
# À exécuter après avoir appliqué la migration 033

echo "🧹 Nettoyage des colonnes dupliquées d'annonces..."

# Appliquer la migration
echo "📦 Application de la migration 033..."
supabase db push

# Vérifier que les colonnes ont été supprimées
echo "🔍 Vérification des colonnes supprimées..."
supabase db inspect --db-url="$(grep SUPABASE_URL .env.local | cut -d '=' -f2)" > /tmp/schema.sql

if grep -q "departure_country\|arrival_country\|available_kg" /tmp/schema.sql; then
    echo "❌ Certaines colonnes dupliquées existent encore"
    exit 1
else
    echo "✅ Colonnes dupliquées supprimées avec succès"
fi

# Régénérer les types TypeScript
echo "🔄 Régénération des types TypeScript..."
supabase gen types typescript --linked > types/supabase.ts

echo "🎉 Nettoyage terminé !"
echo ""
echo "📋 Résumé des changements :"
echo "  - Supprimé: departure_country, departure_city, arrival_country, arrival_city, available_kg"
echo "  - Conservé: origin_country, origin_city, destination_country, destination_city, max_weight_kg"
echo "  - Mis à jour: fonctions RPC search_announcements et count_search_announcements"
echo "  - Mis à jour: requêtes TypeScript pour utiliser les nouveaux noms de paramètres"