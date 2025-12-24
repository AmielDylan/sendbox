#!/bin/bash

# Script pour migrer un domaine métier
DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./migrate-domain.sh <domain-name>"
    exit 1
fi

echo "📦 Migration du domaine: $DOMAIN"

# Copier les actions
if [ -f "lib/actions/${DOMAIN}.ts" ]; then
    cp "lib/actions/${DOMAIN}.ts" "lib/core/${DOMAIN}/actions.ts"
    echo "✓ Actions copiées"
fi

# Copier les validations
if [ -f "lib/validations/${DOMAIN}.ts" ]; then
    cp "lib/validations/${DOMAIN}.ts" "lib/core/${DOMAIN}/validations.ts"
    echo "✓ Validations copiées"
fi

# Copier les queries si elles existent
if [ -f "lib/supabase/queries/${DOMAIN}.ts" ]; then
    cp "lib/supabase/queries/${DOMAIN}.ts" "lib/core/${DOMAIN}/queries.ts"
    echo "✓ Queries copiées"
fi

echo "✅ Migration du domaine $DOMAIN terminée!"
echo "⚠️  N'oubliez pas de mettre à jour les imports"
