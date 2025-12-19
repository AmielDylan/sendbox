#!/bin/bash

# Script pour générer les types TypeScript depuis Supabase
# Usage: bash scripts/generate-types.sh

set -e

echo "🔄 Génération des types TypeScript depuis Supabase..."
echo ""

# Vérifier que Supabase CLI est installé
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI n'est pas installé."
  echo "   Installez-le avec: brew install supabase/tap/supabase"
  exit 1
fi

# Vérifier si le projet est lié
if [ ! -f ".supabase/config.toml" ] && [ ! -f "supabase/.temp/project-ref" ]; then
  echo "⚠️  Le projet n'est pas encore lié à Supabase."
  echo "   Exécutez d'abord: supabase login"
  echo "   Puis: supabase link --project-ref tpvjycjlzxlbrtbvyfsx"
  echo ""
  read -p "Voulez-vous continuer quand même ? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Générer les types
echo "📝 Génération des types..."
supabase gen types typescript --linked > types/supabase.ts

if [ $? -eq 0 ]; then
  echo "✅ Types générés avec succès dans types/supabase.ts"
  echo ""
  echo "📊 Vérification TypeScript..."
  npm run build > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ Build réussi - Types valides"
  else
    echo "⚠️  Erreurs TypeScript détectées. Vérifiez types/supabase.ts"
  fi
else
  echo "❌ Erreur lors de la génération des types"
  exit 1
fi

echo ""
echo "🎉 Terminé !"





