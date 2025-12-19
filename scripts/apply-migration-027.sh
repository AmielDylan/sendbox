#!/bin/bash
# Script pour appliquer la migration 027 sur Supabase

echo "🚀 Application de la migration 027_fix_get_user_conversations_ambiguous.sql"
echo ""
echo "Pour appliquer cette migration, vous avez deux options:"
echo ""
echo "Option 1: Via l'interface Supabase (recommandé)"
echo "  1. Allez sur https://supabase.com/dashboard/project/tpvjycjlzxlbrtbvyfsx"
echo "  2. Cliquez sur 'SQL Editor' dans le menu"
echo "  3. Collez le contenu du fichier supabase/migrations/027_fix_get_user_conversations_ambiguous.sql"
echo "  4. Cliquez sur 'Run'"
echo ""
echo "Option 2: Via Supabase CLI"
echo "  npx supabase db push --db-url 'postgresql://postgres:[PASSWORD]@db.tpvjycjlzxlbrtbvyfsx.supabase.co:5432/postgres'"
echo ""
echo "Le contenu de la migration est:"
echo "============================================"
cat ../supabase/migrations/027_fix_get_user_conversations_ambiguous.sql
echo "============================================"


