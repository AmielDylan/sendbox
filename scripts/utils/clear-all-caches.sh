#!/bin/bash

# Script pour nettoyer tous les caches Next.js et Node

echo "🧹 Nettoyage de tous les caches..."

# Arrêter le serveur s'il tourne
echo "⏹️  Arrêt du serveur dev (si actif)..."
pkill -f "next dev" 2>/dev/null || true

# Nettoyer les caches Next.js
echo "🗑️  Suppression du cache Next.js..."
rm -rf .next

# Nettoyer le cache Turbopack
echo "🗑️  Suppression du cache Turbopack..."
rm -rf node_modules/.cache

# Nettoyer node_modules si demandé
if [ "$1" == "--deep" ]; then
  echo "🗑️  Suppression de node_modules (nettoyage profond)..."
  rm -rf node_modules
  echo "📦 Réinstallation des dépendances..."
  npm install
fi

echo "✅ Nettoyage terminé!"
echo ""
echo "💡 Vous pouvez maintenant relancer le serveur avec: npm run dev"
