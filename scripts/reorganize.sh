#!/bin/bash

# Script de réorganisation du projet Sendbox
# Usage: bash scripts/reorganize.sh

echo "🏗️  Réorganisation du projet Sendbox..."
echo ""

# Couleurs pour output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Créer structure de dossiers
echo -e "${BLUE}📁 Création des dossiers...${NC}"
mkdir -p supabase/migrations supabase/functions
mkdir -p docs/ADR
mkdir -p scripts

# 2. Déplacer fichiers de documentation (si présents à la racine)
echo -e "${BLUE}📄 Déplacement de la documentation...${NC}"
if [ -f "ARCHITECTURE.md" ]; then
  mv ARCHITECTURE.md docs/
  echo "  ✓ ARCHITECTURE.md → docs/"
fi

if [ -f "CURSOR_PROMPTS.md" ]; then
  mv CURSOR_PROMPTS.md docs/
  echo "  ✓ CURSOR_PROMPTS.md → docs/"
fi

if [ -f "DEMARRAGE_RAPIDE.md" ]; then
  mv DEMARRAGE_RAPIDE.md docs/
  echo "  ✓ DEMARRAGE_RAPIDE.md → docs/"
fi

if [ -f "sendbox_schema.sql" ]; then
  mv sendbox_schema.sql docs/
  echo "  ✓ sendbox_schema.sql → docs/"
fi

# 3. Copier schéma vers migrations (si existe)
if [ -f "docs/sendbox_schema.sql" ]; then
  cp docs/sendbox_schema.sql supabase/migrations/001_initial_schema.sql
  echo -e "${GREEN}✓ Migration créée : supabase/migrations/001_initial_schema.sql${NC}"
fi

# 4. Mettre à jour .gitignore
echo -e "${BLUE}🔒 Mise à jour .gitignore...${NC}"
if ! grep -q "supabase/.branches" .gitignore; then
  cat >> .gitignore << 'EOF'

# Supabase
supabase/.branches
supabase/.temp
.env.local
EOF
  echo "  ✓ .gitignore mis à jour"
fi

# 5. Afficher structure finale
echo ""
echo -e "${GREEN}✅ Réorganisation terminée !${NC}"
echo ""
echo "📁 Structure du projet :"
echo ""

# Afficher arborescence (si tree installé, sinon ls)
if command -v tree &> /dev/null; then
  tree -L 2 -I 'node_modules|.next|.git' --dirsfirst
else
  echo "app/"
  ls -1 app/ | sed 's/^/  ├── /'
  echo "supabase/"
  ls -1 supabase/ | sed 's/^/  ├── /'
  echo "docs/"
  ls -1 docs/ | sed 's/^/  ├── /'
  echo "scripts/"
  ls -1 scripts/ | sed 's/^/  ├── /'
fi

echo ""
echo -e "${BLUE}📚 Prochaines étapes :${NC}"
echo "  1. Vérifier que tous les fichiers sont bien placés"
echo "  2. Lire docs/README.md pour la documentation"
echo "  3. Exécuter le Sprint 1.2 (Design System)"
echo ""





