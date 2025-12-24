#!/bin/bash
# Script pour appliquer la migration 030 sur Supabase

echo "🚀 Application de la migration 030: Create bookings table"
echo ""

# Lire le fichier de migration
MIGRATION_FILE="supabase/migrations/030_create_bookings_table.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Erreur: Fichier de migration non trouvé: $MIGRATION_FILE"
  exit 1
fi

echo "📄 Contenu de la migration:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "$MIGRATION_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📋 Instructions pour appliquer cette migration sur Supabase:"
echo ""
echo "1. Aller sur: https://supabase.com/dashboard/project/tpvjycjlzxlbrtbvyfsx"
echo "2. Cliquer sur 'SQL Editor' dans la barre latérale"
echo "3. Cliquer sur 'New query'"
echo "4. Copier le contenu de $MIGRATION_FILE"
echo "5. Coller dans l'éditeur SQL"
echo "6. Cliquer sur 'Run' (ou Ctrl+Enter)"
echo ""
echo "✅ Vérification après migration:"
echo "   - Aucune erreur ne devrait apparaître"
echo "   - La table bookings devrait être créée avec toutes les colonnes de base"
echo "   - Tester la page /dashboard/colis"
echo ""
echo "🧪 Test rapide:"
echo "   node_modules/.bin/tsx scripts/test-all-endpoints.ts"
echo ""

# Copier le contenu dans le presse-papiers si pbcopy est disponible (macOS)
if command -v pbcopy &> /dev/null; then
  cat "$MIGRATION_FILE" | pbcopy
  echo "📋 Le contenu de la migration a été copié dans le presse-papiers!"
  echo ""
fi

echo "Appuyez sur Entrée une fois la migration appliquée..."
read

echo "✅ Migration 030 appliquée!"





